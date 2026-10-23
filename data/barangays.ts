import type { Business } from "@/types";
import raw from "./generated/raw-sources.json";
import { barangayListingId, findArea } from "./barangay-areas";
import { findBarangayHall } from "./osm-match";

/** Shape of data/generated/raw-sources.json, produced from data/rawsources.md. */
interface RawSource {
  id: string;
  name: string;
  urls: string[];
  phone?: string;
  phoneNote?: string;
  geo?: { lat: number; lng: number };
  notes?: string[];
}

const { generatedAt, sources } = raw as { generatedAt: string; sources: RawSource[] };

/**
 * One listing per barangay in data/rawsources.md. Only what that file states is
 * used: the barangay name, its page URL and phone number. No street address,
 * hours or coordinates are invented (coordinates only from a `geo:` line or a matching OpenStreetMap barangay hall), and nothing is marked verified.
 */
export const rawSourceNames: readonly string[] = sources.map((s) => s.name);

export const BARANGAY_LISTINGS: readonly Business[] = sources.map((source) => {
  const hall = findBarangayHall(source.name);
  const coordinates = source.geo ?? (hall ? { lat: hall.lat, lng: hall.lng } : undefined);
  return {
  kind: "business",
  id: barangayListingId(source.id),
  title: `Barangay ${source.name}`,
  description: `Barangay ${source.name} in Kawit, Cavite.${source.urls.length ? " Follow its page for announcements and advisories." : ""}${
    source.phoneNote ? ` Phone listed as: ${source.phoneNote}.` : ""
  }${source.notes?.length ? ` Note: ${source.notes.join(" ")}` : ""}`,
  category: "government",
  barangay: source.name,
  address: hall?.address ?? `Barangay ${source.name}, Kawit, Cavite`,
  coordinates,
  areaId: findArea(source.id) ? source.id : undefined,
  phone: source.phone,
  website: source.urls[0],
  images: [],
  hoursVerified: false,
  recommendations: [],
  tags: ["barangay", "barangay hall", "government", source.name.toLowerCase()],
  verification: "unverified",
  source: { name: source.urls.length ? "Barangay page listed in SAKLAW sources" : "Listed in SAKLAW sources", url: source.urls[0] },
  isDemo: false,
  updatedAt: generatedAt,
  } satisfies Business;
});
