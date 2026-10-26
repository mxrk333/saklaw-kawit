"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { DEFAULT_VIEW, FOCUS_ZOOM, type Basemap, type MapConfig } from "@/lib/map/config";
import { barangayListingId, findArea } from "@/data/barangay-areas";
import { liveFeatureCollection, routeFeature, selectedAreaOutline, toFeatureCollection, userFeatureCollection } from "@/lib/map/geojson";
import { KAWIT_BOUNDS, KAWIT_MAX_BOUNDS } from "@/lib/map/kawit";
import {
  AREA_FILL_LAYER,
  AREA_SELECTED_SOURCE,
  CLUSTER_LAYER,
  LIVE_SOURCE,
  LOCATIONS_SOURCE,
  POINT_LAYER,
  ROUTE_SOURCE,
  SELECTED_SOURCE,
  USER_SOURCE,
  addDataLayers,
  addSatellite,
  applyBasemap,
  enableTerrain,
  ensure3DBuildings,
  setSource,
} from "@/lib/map/layers";
import type { RouteResult } from "@/lib/map/routing";
import type { UserLocation } from "@/hooks/use-user-location";
import type { Coordinates, MapLocation } from "@/types";
import { MapStatusOverlay, type MapStatus } from "./map-status-overlay";
import { findLiveNear } from "@/lib/map/live";
import { buildPopupContent, createOriginElement } from "./map-dom";

export interface MapOrigin {
  coordinates: Coordinates;
  kind: "device" | "manual";
}

export interface MapViewHandle {
  resetView: () => void;
  toggleTilt: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetNorth: () => void;
  flyToCoordinates: (coordinates: Coordinates) => void;
}

export interface MapViewProps {
  ref?: Ref<MapViewHandle>;
  config: MapConfig;
  basemap: Basemap;
  locations: readonly MapLocation[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onRequestDirections: (key: string) => void;
  route: RouteResult | null;
  origin: MapOrigin | null;
  pickingOrigin: boolean;
  onPickOrigin: (coordinates: Coordinates) => void;
  showPopup: boolean;
  /** Pixels covered at the bottom of the map (e.g. by the mobile sheet). */
  bottomPadding: number;
  /** Pixels covered at the top of the map (e.g. by the mobile search overlay). */
  topPadding: number;
  /** Live device position (dot + accuracy ring), or null. */
  userLocation: UserLocation | null;
  /** Keep the camera on the user while their position updates. */
  follow: boolean;
  /** Called when the user takes control of the camera or selects a place. */
  onFollowEnd: () => void;
}

const STYLE_TIMEOUT_MS = 15_000;
const MAP_WORKER_URL = "/maplibre-gl-worker.mjs";
const TAP_RADIUS_PX = 12;

export function MapView(props: MapViewProps) {
  const { ref, config, basemap, locations, selectedKey, route, origin, showPopup, bottomPadding, userLocation, follow } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const originMarkerRef = useRef<maplibregl.Marker | null>(null);
  const latest = useRef(props);
  const [status, setStatus] = useState<MapStatus>({ state: "loading" });
  const ready = status.state === "ready";

  useEffect(() => {
    latest.current = props;
  });

  useImperativeHandle(ref, () => ({
    resetView() {
      const { topPadding, bottomPadding } = latest.current;
      mapRef.current?.fitBounds(KAWIT_BOUNDS, {
        padding: { top: topPadding + 16, left: 16, right: 16, bottom: bottomPadding + 16 },
        pitch: DEFAULT_VIEW.pitch,
        bearing: DEFAULT_VIEW.bearing,
        duration: 1000,
      });
    },
    toggleTilt() {
      const map = mapRef.current;
      if (!map) return;
      const flat = map.getPitch() < 10;
      map.easeTo({ pitch: flat ? DEFAULT_VIEW.pitch : 0, bearing: flat ? DEFAULT_VIEW.bearing : 0 });
    },
    zoomIn() {
      mapRef.current?.zoomIn({ duration: 350 });
    },
    zoomOut() {
      mapRef.current?.zoomOut({ duration: 350 });
    },
    resetNorth() {
      mapRef.current?.easeTo({ bearing: 0, duration: 400 });
    },
    flyToCoordinates(coordinates) {
      mapRef.current?.flyTo({ center: [coordinates.lng, coordinates.lat], zoom: Math.max(15, mapRef.current.getZoom()) });
    },
  }));

  // Create the map once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // The worker is copied to /public by `pnpm copy-map-worker`; bundlers don't resolve it themselves.
    maplibregl.setWorkerUrl(MAP_WORKER_URL);

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container,
        style: config.styleUrl,
        bounds: KAWIT_BOUNDS,
        fitBoundsOptions: { padding: { top: props.topPadding + 16, left: 16, right: 16, bottom: 16 } },
        maxBounds: KAWIT_MAX_BOUNDS,
        minZoom: 11,
        pitch: DEFAULT_VIEW.pitch,
        bearing: DEFAULT_VIEW.bearing,
        maxPitch: 75,
        fadeDuration: 150,
      });
    } catch {
      // Deferred so the failure is reported as an external-system result, not a synchronous effect update.
      queueMicrotask(() =>
        setStatus({ state: "error", message: "This device or browser could not start the 3D map (WebGL is required)." }),
      );
      return;
    }
    mapRef.current = map;

    // Zoom buttons are rendered by MapPanel (so nothing can overlap them); make wheel zoom snappier.
    map.scrollZoom.setWheelZoomRate(1 / 300);

    let loaded = false;
    const timeout = window.setTimeout(() => {
      if (!loaded) setStatus({ state: "error", message: "The map style took too long to load. Check your connection and map configuration." });
    }, STYLE_TIMEOUT_MS);

    map.on("error", (event) => {
      // Before `load`, an error means the style or worker could not be fetched.
      if (!loaded) {
        const detail = event.error?.message ? ` (${event.error.message})` : "";
        setStatus({ state: "error", message: `The map could not start${detail}. Check NEXT_PUBLIC_MAP_STYLE_URL or your API key.` });
      }
    });

    map.on("load", () => {
      loaded = true;
      window.clearTimeout(timeout);
      addDataLayers(map);
      const has3D = ensure3DBuildings(map);
      const hasTerrain = enableTerrain(map, config);
      addSatellite(map, config);
      applyBasemap(map, latest.current.basemap);
      setStatus({ state: "ready", has3D, hasTerrain });
    });

    map.on("click", (event) => {
      const current = latest.current;
      if (current.pickingOrigin) {
        current.onPickOrigin({ lat: event.lngLat.lat, lng: event.lngLat.lng });
        return;
      }
      // A box around the tap makes small markers easy to hit with a finger.
      const { x, y } = event.point;
      const hitBox: [[number, number], [number, number]] = [
        [x - TAP_RADIUS_PX, y - TAP_RADIUS_PX],
        [x + TAP_RADIUS_PX, y + TAP_RADIUS_PX],
      ];
      const feature = map.queryRenderedFeatures(hitBox, { layers: [POINT_LAYER, CLUSTER_LAYER, "saklaw-selected-point"] })[0];
      if (!feature) {
        // Tapping inside a barangay selects it; tapping elsewhere clears the selection.
        const area = map.queryRenderedFeatures(event.point, { layers: [AREA_FILL_LAYER] })[0];
        const areaId = area?.properties?.id;
        current.onSelect(typeof areaId === "string" ? `business:${barangayListingId(areaId)}` : null);
        return;
      }
      if (feature.layer.id === CLUSTER_LAYER && feature.geometry.type === "Point") {
        const clusterId = Number(feature.properties?.cluster_id);
        const [lng, lat] = feature.geometry.coordinates;
        const source = map.getSource(LOCATIONS_SOURCE) as maplibregl.GeoJSONSource;
        source
          .getClusterExpansionZoom(clusterId)
          .then((zoom) => map.easeTo({ center: [lng, lat], zoom: zoom + 0.5 }))
          .catch(() => undefined);
        return;
      }
      const key = feature.properties?.key;
      if (typeof key === "string") current.onSelect(key);
    });

    // Dragging or rotating by hand means the user no longer wants the camera to follow them.
    map.on("dragstart", () => latest.current.onFollowEnd());
    map.on("rotatestart", (event) => {
      if (event.originalEvent) latest.current.onFollowEnd();
    });

    map.on("mousemove", (event) => {
      const hit = map.queryRenderedFeatures(event.point, { layers: [POINT_LAYER, CLUSTER_LAYER, AREA_FILL_LAYER] }).length > 0;
      map.getCanvas().style.cursor = latest.current.pickingOrigin ? "crosshair" : hit ? "pointer" : "";
    });

    return () => {
      window.clearTimeout(timeout);
      popupRef.current?.remove();
      originMarkerRef.current?.remove();
      popupRef.current = null;
      originMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; later prop changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map / satellite basemap.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    applyBasemap(map, basemap);
  }, [basemap, ready]);

  // Result markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    setSource(map, LOCATIONS_SOURCE, toFeatureCollection(locations));
    setSource(map, LIVE_SOURCE, liveFeatureCollection(locations));
  }, [locations, ready]);

  // Frame results (again when the sheet resizes) unless something is selected.
  const locationsKey = locations.map((l) => l.key).join("|");
  useEffect(() => {
    const map = mapRef.current;
    const current = latest.current;
    if (!map || !ready || current.selectedKey || current.locations.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    current.locations.forEach((l) => bounds.extend([l.coordinates.lng, l.coordinates.lat]));
    map.fitBounds(bounds, {
      padding: { top: current.topPadding + 40, left: 40, right: 40, bottom: 40 + current.bottomPadding },
      maxZoom: 15.5,
      duration: 900,
    });
  }, [locationsKey, ready, bottomPadding, props.topPadding]);

  // Selection: highlight, fly, popup.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const selected = latest.current.locations.find((l) => l.key === selectedKey);
    setSource(map, SELECTED_SOURCE, toFeatureCollection(selected ? [selected] : []));
    setSource(map, AREA_SELECTED_SOURCE, selectedAreaOutline(selected?.areaId));

    popupRef.current?.remove();
    popupRef.current = null;
    if (!selected) return;
    latest.current.onFollowEnd();

    const { topPadding, bottomPadding } = latest.current;
    const areaBounds = findArea(selected.areaId)?.bounds;
    if (areaBounds) {
      // A barangay with an outline: show the whole area.
      map.fitBounds(areaBounds, {
        padding: { top: topPadding + 40, left: 30, right: 30, bottom: bottomPadding + 40 },
        maxZoom: 16.5,
        duration: 900,
        essential: true,
      });
    } else {
      map.flyTo({
        center: [selected.coordinates.lng, selected.coordinates.lat],
        // A point that only marks a barangay's middle should not zoom in to street level.
        zoom: selected.precision === "area" ? Math.max(map.getZoom(), 14.8) : Math.max(map.getZoom(), FOCUS_ZOOM),
        padding: { top: topPadding, left: 0, right: 0, bottom: bottomPadding },
        essential: true,
      });
    }

    if (showPopup) {
      popupRef.current = new maplibregl.Popup({ offset: 18, closeButton: false, closeOnClick: false, maxWidth: "260px" })
        .setLngLat([selected.coordinates.lng, selected.coordinates.lat])
        .setDOMContent(buildPopupContent(selected, () => latest.current.onRequestDirections(selected.key), findLiveNear(selected, latest.current.locations)))
        .addTo(map);
    }
  }, [selectedKey, showPopup, bottomPadding, ready]);

  // Live user position.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    setSource(map, USER_SOURCE, userFeatureCollection(userLocation));
  }, [userLocation, ready]);

  // Follow mode: keep the camera on the user.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !follow || !userLocation) return;
    map.easeTo({
      center: [userLocation.coordinates.lng, userLocation.coordinates.lat],
      zoom: Math.max(map.getZoom(), 16),
      padding: { top: latest.current.topPadding, left: 0, right: 0, bottom: latest.current.bottomPadding },
      duration: 800,
    });
  }, [userLocation, follow, ready]);

  // Route line.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    setSource(map, ROUTE_SOURCE, routeFeature(route?.line ?? null));
    if (!route || route.line.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    route.line.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, {
      padding: { top: latest.current.topPadding + 60, left: 40, right: 40, bottom: 60 + latest.current.bottomPadding },
      duration: 900,
    });
  }, [route, ready]);

  // Origin marker (device location or a manually picked point).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    originMarkerRef.current?.remove();
    originMarkerRef.current = null;
    if (!origin) return;
    originMarkerRef.current = new maplibregl.Marker({ element: createOriginElement(origin.kind) })
      .setLngLat([origin.coordinates.lng, origin.coordinates.lat])
      .addTo(map);
  }, [origin, ready]);

  return (
    <div className="relative size-full">
      <div ref={containerRef} className="size-full" aria-label="Interactive 3D map of Kawit" role="region" />
      <MapStatusOverlay status={status} />
    </div>
  );
}
