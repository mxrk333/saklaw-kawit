import type * as maplibregl from "maplibre-gl";
import type { Basemap, MapConfig } from "./config";
import { TYPE_COLORS, areaLabels, areaOutlines, routeFeature, selectedAreaOutline, toFeatureCollection, userFeatureCollection } from "./geojson";
import { kawitMask, kawitOutline } from "./kawit";

export const LOCATIONS_SOURCE = "saklaw-locations";
export const SELECTED_SOURCE = "saklaw-selected";
export const LIVE_SOURCE = "saklaw-live";
export const ROUTE_SOURCE = "saklaw-route";
export const USER_SOURCE = "saklaw-user";
export const AREA_SELECTED_SOURCE = "saklaw-area-selected";
export const AREA_FILL_LAYER = "saklaw-areas-fill";
export const POINT_LAYER = "saklaw-points";
export const CLUSTER_LAYER = "saklaw-clusters";
const SATELLITE_SOURCE = "saklaw-satellite";
const SATELLITE_LAYER = "saklaw-satellite";

/** Glyph stack available on OpenFreeMap and MapTiler styles. */
const LABEL_FONT = ["Noto Sans Regular"];

const GREEN = "#15803d";
const LIVE_RED = "#e11d48";

/**
 * Turns on 3D terrain, soft hillshading and a sky. The hillshade is inserted
 * under the style's labels so place names stay crisp. Returns whether terrain is on.
 */
export function enableTerrain(map: maplibregl.Map, config: MapConfig): boolean {
  if (!config.terrain) return false;
  // Separate sources for 3D terrain and hillshade give better rendering than sharing one.
  map.addSource("saklaw-terrain", config.terrain.source);
  map.addSource("saklaw-hillshade-dem", config.terrain.source);

  const firstLabel = (map.getStyle().layers ?? []).find((layer) => layer.type === "symbol")?.id;
  map.addLayer(
    {
      id: "saklaw-hillshade",
      type: "hillshade",
      source: "saklaw-hillshade-dem",
      paint: {
        "hillshade-exaggeration": 0.45,
        "hillshade-shadow-color": "#4b5563",
        "hillshade-highlight-color": "#ffffff",
        "hillshade-accent-color": "#6b7280",
      },
    },
    firstLabel,
  );

  map.setTerrain({ source: "saklaw-terrain", exaggeration: config.terrain.exaggeration });
  map.setSky({
    "sky-color": "#a9cdf0",
    "horizon-color": "#f5f1e8",
    "fog-color": "#ece9e1",
    "sky-horizon-blend": 0.5,
    "horizon-fog-blend": 0.6,
    "fog-ground-blend": 0.3,
  });
  return true;
}

/**
 * Adds an extruded building layer when the style has building footprints but
 * no 3D layer of its own. Styles that already ship one are left untouched.
 */
export function ensure3DBuildings(map: maplibregl.Map): boolean {
  const layers = map.getStyle().layers ?? [];
  if (layers.some((l) => l.type === "fill-extrusion")) return true;

  const footprint = layers.find((l) => "source-layer" in l && l["source-layer"] === "building" && "source" in l);
  if (!footprint || !("source" in footprint) || typeof footprint.source !== "string") return false;

  map.addLayer({
    id: "saklaw-3d-buildings",
    type: "fill-extrusion",
    source: footprint.source,
    "source-layer": "building",
    minzoom: 14,
    paint: {
      "fill-extrusion-color": "#d6d3d1",
      "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 8],
      "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
      "fill-extrusion-opacity": 0.85,
    },
  });
  return true;
}

/** Dims everything outside Kawit and outlines the town. Sits under the data layers. */
function addBoundaryLayers(map: maplibregl.Map): void {
  map.addSource("saklaw-kawit-mask", { type: "geojson", data: kawitMask() });
  map.addSource("saklaw-kawit-outline", { type: "geojson", data: kawitOutline() });
  map.addLayer({
    id: "saklaw-kawit-mask",
    type: "fill",
    source: "saklaw-kawit-mask",
    paint: { "fill-color": "#e7e5e4", "fill-opacity": 0.62 },
  });
  map.addLayer({
    id: "saklaw-kawit-outline",
    type: "line",
    source: "saklaw-kawit-outline",
    layout: { "line-join": "round" },
    paint: { "line-color": GREEN, "line-width": 2.5, "line-opacity": 0.85 },
  });
}

/** Faint barangay outlines and names, plus a highlight for the selected barangay. */
function addAreaLayers(map: maplibregl.Map): void {
  map.addSource("saklaw-areas", { type: "geojson", data: areaOutlines() });
  map.addSource("saklaw-area-labels", { type: "geojson", data: areaLabels() });
  map.addSource(AREA_SELECTED_SOURCE, { type: "geojson", data: selectedAreaOutline(undefined) });

  // Invisible fill: lets a tap inside a barangay select it.
  map.addLayer({ id: AREA_FILL_LAYER, type: "fill", source: "saklaw-areas", paint: { "fill-color": "#000000", "fill-opacity": 0 } });
  map.addLayer({
    id: "saklaw-areas-casing",
    type: "line",
    source: "saklaw-areas",
    paint: { "line-color": "#0f172a", "line-width": 3, "line-opacity": 0.28 },
  });
  map.addLayer({
    id: "saklaw-areas-line",
    type: "line",
    source: "saklaw-areas",
    paint: { "line-color": "#f8fafc", "line-width": 1.4, "line-opacity": 0.9, "line-dasharray": [3, 2] },
  });
  map.addLayer({
    id: "saklaw-area-selected-fill",
    type: "fill",
    source: AREA_SELECTED_SOURCE,
    paint: { "fill-color": GREEN, "fill-opacity": 0.2 },
  });
  map.addLayer({
    id: "saklaw-area-selected-line",
    type: "line",
    source: AREA_SELECTED_SOURCE,
    layout: { "line-join": "round" },
    paint: { "line-color": "#4ade80", "line-width": 3.5 },
  });
  map.addLayer({
    id: "saklaw-area-labels",
    type: "symbol",
    source: "saklaw-area-labels",
    minzoom: 12,
    maxzoom: 15.5,
    layout: {
      "text-field": ["get", "name"],
      "text-font": LABEL_FONT,
      "text-size": 11,
      "text-transform": "uppercase",
      "text-letter-spacing": 0.08,
      "text-max-width": 7,
    },
    paint: { "text-color": "#ffffff", "text-halo-color": "rgba(15, 23, 42, 0.78)", "text-halo-width": 1.6 },
  });
}

export function addDataLayers(map: maplibregl.Map): void {
  addBoundaryLayers(map);
  addAreaLayers(map);
  map.addSource(LOCATIONS_SOURCE, {
    type: "geojson",
    data: toFeatureCollection([]),
    cluster: true,
    // Tight clustering so individual places appear after a zoom step or two, not five.
    clusterRadius: 30,
    clusterMaxZoom: 13,
  });
  map.addSource(SELECTED_SOURCE, { type: "geojson", data: toFeatureCollection([]) });
  map.addSource(LIVE_SOURCE, { type: "geojson", data: toFeatureCollection([]) });
  map.addSource(ROUTE_SOURCE, { type: "geojson", data: routeFeature(null) });
  map.addSource(USER_SOURCE, { type: "geojson", data: userFeatureCollection(null) });

  map.addLayer({
    id: "saklaw-route-casing",
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.9 },
  });
  map.addLayer({
    id: "saklaw-route-line",
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#2563eb", "line-width": 5 },
  });

  // The user's position sits under the result markers so pins stay tappable.
  map.addLayer({
    id: "saklaw-user-accuracy",
    type: "fill",
    source: USER_SOURCE,
    filter: ["==", ["get", "kind"], "accuracy"],
    paint: { "fill-color": "#2563eb", "fill-opacity": 0.14 },
  });
  map.addLayer({
    id: "saklaw-user-dot",
    type: "circle",
    source: USER_SOURCE,
    filter: ["==", ["get", "kind"], "dot"],
    paint: {
      "circle-radius": 8,
      "circle-color": "#2563eb",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 3,
      "circle-pitch-alignment": "map",
    },
  });

  // Events happening right now: soft red rings under everything else, always visible.
  map.addLayer({
    id: "saklaw-live-halo-outer",
    type: "circle",
    source: LIVE_SOURCE,
    paint: { "circle-color": LIVE_RED, "circle-radius": 30, "circle-opacity": 0.14, "circle-pitch-alignment": "map" },
  });
  map.addLayer({
    id: "saklaw-live-halo-inner",
    type: "circle",
    source: LIVE_SOURCE,
    paint: {
      "circle-color": LIVE_RED,
      "circle-radius": 18,
      "circle-opacity": 0.28,
      "circle-stroke-color": LIVE_RED,
      "circle-stroke-width": 1.5,
      "circle-stroke-opacity": 0.7,
      "circle-pitch-alignment": "map",
    },
  });

  map.addLayer({
    id: CLUSTER_LAYER,
    type: "circle",
    source: LOCATIONS_SOURCE,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": GREEN,
      "circle-radius": ["step", ["get", "point_count"], 16, 5, 20, 15, 26],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
      "circle-opacity": 0.92,
    },
  });
  map.addLayer({
    id: "saklaw-cluster-count",
    type: "symbol",
    source: LOCATIONS_SOURCE,
    filter: ["has", "point_count"],
    layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": LABEL_FONT, "text-size": 12 },
    paint: { "text-color": "#ffffff" },
  });
  map.addLayer({
    id: POINT_LAYER,
    type: "circle",
    source: LOCATIONS_SOURCE,
    filter: ["!", ["has", "point_count"]],
    paint: {
      // Area-only pins (middle of a barangay) are hollow so they never look like an exact address.
      "circle-color": [
        "case",
        ["==", ["get", "precision"], "area"],
        "#ffffff",
        ["match", ["get", "type"], "business", TYPE_COLORS.business, "event", TYPE_COLORS.event, TYPE_COLORS.announcement],
      ],
      "circle-radius": 8,
      "circle-stroke-color": [
        "case",
        ["==", ["get", "precision"], "area"],
        TYPE_COLORS.business,
        "#ffffff",
      ],
      "circle-stroke-width": ["case", ["==", ["get", "precision"], "area"], 3.5, 2.5],
    },
  });
  map.addLayer({
    id: "saklaw-point-labels",
    type: "symbol",
    source: LOCATIONS_SOURCE,
    minzoom: 14.5,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-field": ["get", "title"],
      "text-font": LABEL_FONT,
      "text-size": 11,
      "text-anchor": "top",
      "text-offset": [0, 1],
      "text-optional": true,
      "text-max-width": 8,
    },
    paint: { "text-color": "#111827", "text-halo-color": "#ffffff", "text-halo-width": 1.6 },
  });
  // "LIVE" tag above events that are happening now.
  map.addLayer({
    id: "saklaw-live-tag",
    type: "symbol",
    source: LIVE_SOURCE,
    layout: {
      "text-field": "● LIVE",
      "text-font": LABEL_FONT,
      "text-size": 12,
      "text-anchor": "bottom",
      "text-offset": [0, -1.4],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: { "text-color": "#ffffff", "text-halo-color": LIVE_RED, "text-halo-width": 4 },
  });
  map.addLayer({
    id: "saklaw-selected-halo",
    type: "circle",
    source: SELECTED_SOURCE,
    paint: { "circle-radius": 20, "circle-color": GREEN, "circle-opacity": 0.22, "circle-pitch-alignment": "map" },
  });
  map.addLayer({
    id: "saklaw-selected-point",
    type: "circle",
    source: SELECTED_SOURCE,
    paint: {
      "circle-radius": 11,
      "circle-color": [
        "match",
        ["get", "type"],
        "business",
        TYPE_COLORS.business,
        "event",
        TYPE_COLORS.event,
        TYPE_COLORS.announcement,
      ],
      "circle-stroke-color": "#111827",
      "circle-stroke-width": 3,
    },
  });
}

export function setSource(map: maplibregl.Map, id: string, data: GeoJSON.GeoJSON): void {
  const source = map.getSource(id);
  if (source && "setData" in source) (source as maplibregl.GeoJSONSource).setData(data);
}

/** Adds the (initially hidden) aerial imagery layer beneath the whole vector style. */
export function addSatellite(map: maplibregl.Map, config: MapConfig): boolean {
  if (!config.satellite) return false;
  map.addSource(SATELLITE_SOURCE, {
    type: "raster",
    tiles: config.satellite.tiles,
    tileSize: 256,
    maxzoom: config.satellite.maxzoom,
    attribution: config.satellite.attribution,
  });
  const firstStyleLayer = (map.getStyle().layers ?? []).find((layer) => layer.type !== "background")?.id;
  map.addLayer(
    {
      id: SATELLITE_LAYER,
      type: "raster",
      source: SATELLITE_SOURCE,
      layout: { visibility: "none" },
      paint: { "raster-fade-duration": 150, "raster-resampling": "linear" },
    },
    firstStyleLayer,
  );
  return true;
}

type StringValue = maplibregl.DataDrivenPropertyValueSpecification<string> | undefined;
type NumberValue = maplibregl.DataDrivenPropertyValueSpecification<number> | undefined;

interface TextPaint {
  id: string;
  color: StringValue;
  haloColor: StringValue;
  haloWidth: NumberValue;
}
interface BasemapRestore {
  hidden: string[];
  text: TextPaint[];
}
const restoreState = new WeakMap<maplibregl.Map, BasemapRestore>();

const FLAT_LAYER_TYPES = new Set(["fill", "line", "fill-extrusion", "raster", "hillshade"]);

/**
 * Switches between the vector map and satellite imagery. In satellite mode the
 * style's fills, roads and buildings are hidden (the imagery shows them) and its
 * labels are restyled white-on-dark so they read over photos. Everything
 * SAKLAW adds (`saklaw-*`) stays visible. Switching back restores the style.
 */
export function applyBasemap(map: maplibregl.Map, basemap: Basemap): void {
  if (!map.getLayer(SATELLITE_LAYER)) return;
  const current = restoreState.get(map) ?? { hidden: [], text: [] };
  const isSatellite = current.hidden.length > 0;

  if (basemap === "satellite" && !isSatellite) {
    const hidden: string[] = [];
    const text: TextPaint[] = [];
    for (const layer of map.getStyle().layers ?? []) {
      if (layer.id.startsWith("saklaw-")) continue;
      if (FLAT_LAYER_TYPES.has(layer.type)) {
        map.setLayoutProperty(layer.id, "visibility", "none");
        hidden.push(layer.id);
      } else if (layer.type === "symbol" && map.getLayoutProperty(layer.id, "text-field")) {
        text.push({
          id: layer.id,
          color: map.getPaintProperty(layer.id, "text-color") as StringValue,
          haloColor: map.getPaintProperty(layer.id, "text-halo-color") as StringValue,
          haloWidth: map.getPaintProperty(layer.id, "text-halo-width") as NumberValue,
        });
        map.setPaintProperty(layer.id, "text-color", "#ffffff");
        map.setPaintProperty(layer.id, "text-halo-color", "rgba(0, 0, 0, 0.78)");
        map.setPaintProperty(layer.id, "text-halo-width", 1.5);
      }
    }
    map.setLayoutProperty(SATELLITE_LAYER, "visibility", "visible");
    if (map.getLayer("saklaw-hillshade")) map.setLayoutProperty("saklaw-hillshade", "visibility", "none");
    restoreState.set(map, { hidden, text });
  } else if (basemap === "map" && isSatellite) {
    for (const id of current.hidden) map.setLayoutProperty(id, "visibility", "visible");
    for (const entry of current.text) {
      map.setPaintProperty(entry.id, "text-color", entry.color);
      map.setPaintProperty(entry.id, "text-halo-color", entry.haloColor);
      map.setPaintProperty(entry.id, "text-halo-width", entry.haloWidth);
    }
    map.setLayoutProperty(SATELLITE_LAYER, "visibility", "none");
    if (map.getLayer("saklaw-hillshade")) map.setLayoutProperty("saklaw-hillshade", "visibility", "visible");
    restoreState.set(map, { hidden: [], text: [] });
  }
}
