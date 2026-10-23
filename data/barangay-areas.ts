import type { Geometry } from "geojson";
import type { Coordinates } from "@/types";
import raw from "./generated/barangay-areas.json";

/** A barangay's area from OpenStreetMap: an outline when mapped, otherwise only a center point. */
export interface BarangayArea {
  /** Matches the id of the barangay in data/rawsources.md. */
  id: string;
  name: string;
  osmType: string;
  osmId: number;
  center: Coordinates;
  /** [west, south, east, north]; null when OSM only has a point. */
  bounds: [number, number, number, number] | null;
  geometry: Geometry | null;
}

export const BARANGAY_AREAS: readonly BarangayArea[] = (raw as { areas: BarangayArea[] }).areas;

export function findArea(id: string | undefined): BarangayArea | undefined {
  return id ? BARANGAY_AREAS.find((area) => area.id === id) : undefined;
}

/** Listing id for a barangay (used by data/barangays.ts and for tap-to-select on the map). */
export const barangayListingId = (areaId: string) => `barangay-${areaId}`;
