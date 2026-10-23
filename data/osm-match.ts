import type { WeeklyHours } from "@/types";
import osm from "./generated/osm-places.json";

/** One place imported from OpenStreetMap by scripts/import-osm.mjs. */
export interface OsmPlace {
  osmType: string;
  osmId: number;
  name: string;
  category: "places" | "shopping" | "health" | "food" | "stay" | "attractions" | "schools" | "government";
  tags: string[];
  /** Original OSM tag, e.g. "amenity=pharmacy". */
  osmTag: string;
  lat: number;
  lng: number;
  barangay: string;
  address: string;
  phone?: string;
  website?: string;
  /** Raw OSM opening_hours tag. */
  openingHours?: string;
  /** Parsed from openingHours; absent when the tag is missing or uses syntax we don't fully support. */
  hours?: WeeklyHours;
}

const data = osm as { source: string; fetchedAt: string; places: OsmPlace[] };

export const OSM_FETCHED_AT = data.fetchedAt;
export const ALL_OSM_PLACES: readonly OsmPlace[] = data.places;

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Finds the OSM barangay hall named "<barangay> Barangay Hall", if mapped. */
export function findBarangayHall(barangayName: string): OsmPlace | undefined {
  const target = `${normalize(barangayName)} barangay hall`;
  return ALL_OSM_PLACES.find((p) => p.osmTag === "amenity=townhall" && normalize(p.name) === target);
}
