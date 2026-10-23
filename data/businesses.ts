import type { Business } from "@/types";
import { BARANGAY_LISTINGS } from "./barangays";
import { OSM_BUSINESSES } from "./osm-places";

/** All business-like listings. Add new real sources here as they are ingested. */
export const BUSINESSES: readonly Business[] = [...BARANGAY_LISTINGS, ...OSM_BUSINESSES];
