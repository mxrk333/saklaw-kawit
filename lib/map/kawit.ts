import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";
import boundary from "@/data/generated/kawit-boundary.json";
import type { Coordinates } from "@/types";
// Shared with the OSM importer so "inside Kawit" means the same thing everywhere.
import { pointInGeometry } from "../../scripts/osm-lib.mjs";

/** Kawit's administrative boundary from OpenStreetMap contributors (ODbL), relation 1485548. */
const geometry = boundary.geometry as Polygon | MultiPolygon;
const [west, south, east, north] = boundary.bounds as [number, number, number, number];

export type LngLatBoundsTuple = [[number, number], [number, number]];

export const KAWIT_BOUNDS: LngLatBoundsTuple = [
  [west, south],
  [east, north],
];

/** Panning is limited to Kawit plus a small margin, so the app stays Kawit-only. */
const MARGIN_DEG = 0.012;
export const KAWIT_MAX_BOUNDS: LngLatBoundsTuple = [
  [west - MARGIN_DEG, south - MARGIN_DEG],
  [east + MARGIN_DEG, north + MARGIN_DEG],
];

function outerRings(): Position[][] {
  return geometry.type === "Polygon" ? [geometry.coordinates[0]] : geometry.coordinates.map((polygon) => polygon[0]);
}

/** A world-sized polygon with Kawit cut out, used to dim everything outside the town. */
export function kawitMask(): Feature<Polygon> {
  const world: Position[] = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
  ];
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [world, ...outerRings()] } };
}

export function kawitOutline(): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: outerRings().map((ring) => ({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: ring },
    })),
  };
}

export function isInsideKawit({ lat, lng }: Coordinates): boolean {
  return pointInGeometry(lng, lat, geometry);
}
