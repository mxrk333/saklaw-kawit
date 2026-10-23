import type { FeatureCollection, LineString, Point } from "geojson";
import type { ContentType, MapLocation } from "@/types";

export const TYPE_COLORS: Record<ContentType, string> = {
  business: "#15803d",
  event: "#d97706",
  announcement: "#2563eb",
};

export interface LocationProperties {
  key: string;
  type: ContentType;
  title: string;
}

export function toFeatureCollection(locations: readonly MapLocation[]): FeatureCollection<Point, LocationProperties> {
  return {
    type: "FeatureCollection",
    features: locations.map((l) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [l.coordinates.lng, l.coordinates.lat] },
      properties: { key: l.key, type: l.type, title: l.title },
    })),
  };
}

export function routeFeature(line: [number, number][] | null): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: line ? [{ type: "Feature", geometry: { type: "LineString", coordinates: line }, properties: {} }] : [],
  };
}
