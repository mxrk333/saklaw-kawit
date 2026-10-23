import type * as maplibregl from "maplibre-gl";
import type { MapConfig } from "./config";
import { TYPE_COLORS, routeFeature, toFeatureCollection } from "./geojson";

export const LOCATIONS_SOURCE = "saklaw-locations";
export const SELECTED_SOURCE = "saklaw-selected";
export const ROUTE_SOURCE = "saklaw-route";
export const POINT_LAYER = "saklaw-points";
export const CLUSTER_LAYER = "saklaw-clusters";

/** Glyph stack available on OpenFreeMap and MapTiler styles. */
const LABEL_FONT = ["Noto Sans Regular"];

const GREEN = "#15803d";

export function enableTerrain(map: maplibregl.Map, config: MapConfig): boolean {
  if (!config.terrainUrl) return false;
  map.addSource("saklaw-terrain", { type: "raster-dem", url: config.terrainUrl, tileSize: 256 });
  map.setTerrain({ source: "saklaw-terrain", exaggeration: 1.3 });
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

export function addDataLayers(map: maplibregl.Map): void {
  map.addSource(LOCATIONS_SOURCE, {
    type: "geojson",
    data: toFeatureCollection([]),
    cluster: true,
    clusterRadius: 44,
    clusterMaxZoom: 15,
  });
  map.addSource(SELECTED_SOURCE, { type: "geojson", data: toFeatureCollection([]) });
  map.addSource(ROUTE_SOURCE, { type: "geojson", data: routeFeature(null) });

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
      "circle-color": [
        "match",
        ["get", "type"],
        "business",
        TYPE_COLORS.business,
        "event",
        TYPE_COLORS.event,
        TYPE_COLORS.announcement,
      ],
      "circle-radius": 8,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2.5,
    },
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
