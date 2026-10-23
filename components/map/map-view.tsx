"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { DEFAULT_VIEW, FOCUS_ZOOM, type MapConfig } from "@/lib/map/config";
import { routeFeature, toFeatureCollection } from "@/lib/map/geojson";
import {
  CLUSTER_LAYER,
  LOCATIONS_SOURCE,
  POINT_LAYER,
  ROUTE_SOURCE,
  SELECTED_SOURCE,
  addDataLayers,
  enableTerrain,
  ensure3DBuildings,
  setSource,
} from "@/lib/map/layers";
import type { RouteResult } from "@/lib/map/routing";
import type { Coordinates, MapLocation } from "@/types";
import { MapStatusOverlay, type MapStatus } from "./map-status-overlay";
import { buildPopupContent, createOriginElement } from "./map-dom";

export interface MapOrigin {
  coordinates: Coordinates;
  kind: "device" | "manual";
}

export interface MapViewHandle {
  resetView: () => void;
  toggleTilt: () => void;
  flyToCoordinates: (coordinates: Coordinates) => void;
}

export interface MapViewProps {
  ref?: Ref<MapViewHandle>;
  config: MapConfig;
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
}

const STYLE_TIMEOUT_MS = 15_000;
const MAP_WORKER_URL = "/maplibre-gl-worker.mjs";

export function MapView(props: MapViewProps) {
  const { ref, config, locations, selectedKey, route, origin, showPopup, bottomPadding } = props;

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
      mapRef.current?.flyTo({
        center: [DEFAULT_VIEW.center.lng, DEFAULT_VIEW.center.lat],
        zoom: DEFAULT_VIEW.zoom,
        pitch: DEFAULT_VIEW.pitch,
        bearing: DEFAULT_VIEW.bearing,
        padding: { top: 0, left: 0, right: 0, bottom: 0 },
      });
    },
    toggleTilt() {
      const map = mapRef.current;
      if (!map) return;
      const flat = map.getPitch() < 10;
      map.easeTo({ pitch: flat ? DEFAULT_VIEW.pitch : 0, bearing: flat ? DEFAULT_VIEW.bearing : 0 });
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
        center: [DEFAULT_VIEW.center.lng, DEFAULT_VIEW.center.lat],
        zoom: DEFAULT_VIEW.zoom,
        pitch: DEFAULT_VIEW.pitch,
        bearing: DEFAULT_VIEW.bearing,
        maxPitch: 75,
      });
    } catch {
      // Deferred so the failure is reported as an external-system result, not a synchronous effect update.
      queueMicrotask(() =>
        setStatus({ state: "error", message: "This device or browser could not start the 3D map (WebGL is required)." }),
      );
      return;
    }
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

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
      setStatus({ state: "ready", has3D, hasTerrain });
    });

    map.on("click", (event) => {
      const current = latest.current;
      if (current.pickingOrigin) {
        current.onPickOrigin({ lat: event.lngLat.lat, lng: event.lngLat.lng });
        return;
      }
      const feature = map.queryRenderedFeatures(event.point, { layers: [POINT_LAYER, CLUSTER_LAYER, "saklaw-selected-point"] })[0];
      if (!feature) {
        current.onSelect(null);
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

    map.on("mousemove", (event) => {
      const hit = map.queryRenderedFeatures(event.point, { layers: [POINT_LAYER, CLUSTER_LAYER] }).length > 0;
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

  // Result markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    setSource(map, LOCATIONS_SOURCE, toFeatureCollection(locations));
  }, [locations, ready]);

  // Frame new results unless something is selected.
  const locationsKey = locations.map((l) => l.key).join("|");
  useEffect(() => {
    const map = mapRef.current;
    const current = latest.current;
    if (!map || !ready || current.selectedKey || current.locations.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    current.locations.forEach((l) => bounds.extend([l.coordinates.lng, l.coordinates.lat]));
    map.fitBounds(bounds, {
      padding: { top: 70, left: 60, right: 60, bottom: 70 + current.bottomPadding },
      maxZoom: 15.5,
      duration: 900,
    });
  }, [locationsKey, ready]);

  // Selection: highlight, fly, popup.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const selected = latest.current.locations.find((l) => l.key === selectedKey);
    setSource(map, SELECTED_SOURCE, toFeatureCollection(selected ? [selected] : []));

    popupRef.current?.remove();
    popupRef.current = null;
    if (!selected) return;

    map.flyTo({
      center: [selected.coordinates.lng, selected.coordinates.lat],
      zoom: Math.max(map.getZoom(), FOCUS_ZOOM),
      padding: { top: 0, left: 0, right: 0, bottom: latest.current.bottomPadding },
      essential: true,
    });

    if (showPopup) {
      popupRef.current = new maplibregl.Popup({ offset: 18, closeButton: false, closeOnClick: false, maxWidth: "260px" })
        .setLngLat([selected.coordinates.lng, selected.coordinates.lat])
        .setDOMContent(buildPopupContent(selected, () => latest.current.onRequestDirections(selected.key)))
        .addTo(map);
    }
  }, [selectedKey, showPopup, bottomPadding, ready]);

  // Route line.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    setSource(map, ROUTE_SOURCE, routeFeature(route?.line ?? null));
    if (!route || route.line.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    route.line.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, {
      padding: { top: 80, left: 60, right: 60, bottom: 80 + latest.current.bottomPadding },
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
