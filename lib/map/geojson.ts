import type { Feature, FeatureCollection, LineString, Point, Polygon } from "geojson";
import type { UserLocation } from "@/hooks/use-user-location";
import { BARANGAY_AREAS, findArea } from "@/data/barangay-areas";
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
  precision: "exact" | "area";
}

export function toFeatureCollection(locations: readonly MapLocation[]): FeatureCollection<Point, LocationProperties> {
  return {
    type: "FeatureCollection",
    features: locations.map((l) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [l.coordinates.lng, l.coordinates.lat] },
      properties: { key: l.key, type: l.type, title: l.title, precision: l.precision },
    })),
  };
}

export function routeFeature(line: [number, number][] | null): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: line ? [{ type: "Feature", geometry: { type: "LineString", coordinates: line }, properties: {} }] : [],
  };
}

const EARTH_RADIUS_M = 6_371_000;

/** Approximates a circle of `radiusMeters` around a point as a polygon. */
export function circlePolygon(lng: number, lat: number, radiusMeters: number, steps = 48): Polygon {
  const latRad = (lat * Math.PI) / 180;
  const ring: [number, number][] = Array.from({ length: steps + 1 }, (_, i) => {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = ((radiusMeters * Math.cos(angle)) / EARTH_RADIUS_M) * (180 / Math.PI);
    const dLng = ((radiusMeters * Math.sin(angle)) / (EARTH_RADIUS_M * Math.cos(latRad))) * (180 / Math.PI);
    return [lng + dLng, lat + dLat];
  });
  return { type: "Polygon", coordinates: [ring] };
}

/** Position dot plus its accuracy circle; empty when there is no fix. */
export function userFeatureCollection(location: UserLocation | null): FeatureCollection<Point | Polygon> {
  if (!location) return { type: "FeatureCollection", features: [] };
  const { lng, lat } = location.coordinates;
  return {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { kind: "accuracy" }, geometry: circlePolygon(lng, lat, Math.max(location.accuracy, 5)) },
      { type: "Feature", properties: { kind: "dot" }, geometry: { type: "Point", coordinates: [lng, lat] } },
    ],
  };
}

/** Outlines of every barangay that OSM has a boundary for (used for hit-testing and context lines). */
export function areaOutlines(): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: BARANGAY_AREAS.flatMap((area): Feature[] =>
      area.geometry ? [{ type: "Feature", properties: { id: area.id, name: area.name }, geometry: area.geometry }] : [],
    ),
  };
}

/** One labelled point per barangay, so every barangay name can be drawn. */
export function areaLabels(): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: BARANGAY_AREAS.map((area) => ({
      type: "Feature",
      properties: { name: area.name },
      geometry: { type: "Point", coordinates: [area.center.lng, area.center.lat] },
    })),
  };
}

/** The selected barangay's outline (empty when it only has a point). */
export function selectedAreaOutline(areaId: string | undefined): FeatureCollection {
  const area = findArea(areaId);
  const features: Feature[] = area?.geometry ? [{ type: "Feature", properties: {}, geometry: area.geometry }] : [];
  return { type: "FeatureCollection", features };
}
