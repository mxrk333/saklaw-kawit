import type { Business, CategoryId } from "@/types";
import raw from "./generated/curated-places.json";

/** Shape of data/generated/curated-places.json, produced from data/places.md. */
interface CuratedPlace {
  id: string;
  name: string;
  category: CategoryId;
  type?: string;
  tags: string[];
  geo?: { lat: number; lng: number };
  address?: string;
  barangay?: string;
  phone?: string;
  website?: string;
  source?: string;
  note?: string;
}

const { generatedAt, places } = raw as { generatedAt: string; places: CuratedPlace[] };

/**
 * Places added by hand in data/places.md. They are shown as community-added and
 * unverified until someone confirms them; hours are never assumed.
 */
export const CURATED_PLACES: readonly Business[] = places.map((place) => ({
  kind: "business",
  id: `place-${place.id}`,
  title: place.name,
  description: `${place.type ? `${place.type[0].toUpperCase()}${place.type.slice(1)}` : "Place"}${
    place.barangay ? ` in ${place.barangay}` : ""
  }, Kawit. Added by the SAKLAW team; hours and details are not confirmed.${place.note ? ` ${place.note}` : ""}`,
  category: place.category,
  barangay: place.barangay ?? "Kawit",
  address: place.address ?? `${place.barangay ? `${place.barangay}, ` : ""}Kawit, Cavite`,
  coordinates: place.geo,
  phone: place.phone,
  website: place.website,
  images: [],
  hoursVerified: false,
  recommendations: [],
  tags: [...place.tags, place.name.toLowerCase()],
  verification: "community",
  source: { name: "Added by the SAKLAW team", url: place.source },
  isDemo: false,
  updatedAt: generatedAt,
}));
