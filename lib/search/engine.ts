import { findArea } from "@/data/barangay-areas";
import { CATEGORY_LABELS } from "@/data/categories";
import type { Business, Listing, MapLocation, SearchFilters, SearchResult } from "@/types";
import { isOpenNow } from "@/lib/utils/hours";
import { isCurrentListing, resolveVerification } from "@/lib/utils/verification";
import { expandTerm } from "./synonyms";

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function toMapLocation(listing: Listing): MapLocation | undefined {
  const areaId = listing.kind === "business" ? listing.areaId : undefined;
  const exact = listing.coordinates;
  const coordinates = exact ?? findArea(areaId)?.center;
  if (!coordinates) return undefined;
  return {
    key: `${listing.kind}:${listing.id}`,
    type: listing.kind,
    id: listing.id,
    title: listing.title,
    categoryLabel: CATEGORY_LABELS[listing.category],
    address: listing.kind === "business" ? listing.address : listing.kind === "event" ? listing.venue : undefined,
    coordinates,
    precision: exact ? "exact" : "area",
    areaId,
  };
}

interface Haystack {
  title: string[];
  tags: string[];
  context: string[];
  description: string[];
}

function buildHaystack(listing: Listing): Haystack {
  const topic = listing.kind === "announcement" ? listing.topic.replace("-", " ") : listing.kind;
  return {
    title: tokenize(listing.title),
    tags: listing.tags.flatMap(tokenize),
    context: tokenize(`${CATEGORY_LABELS[listing.category]} ${topic} ${listing.barangay}`),
    description: tokenize(listing.description),
  };
}

function hasPrefix(words: readonly string[], term: string): boolean {
  return words.some((w) => w.startsWith(term));
}

/** Best score any synonym earns for one query token; 0 means no match. */
function scoreToken(haystack: Haystack, token: string): number {
  let best = 0;
  for (const term of expandTerm(token)) {
    const exact = term === token ? 1 : 0.7;
    if (hasPrefix(haystack.title, term)) best = Math.max(best, 6 * exact);
    if (hasPrefix(haystack.tags, term)) best = Math.max(best, 5 * exact);
    // Category/topic text only counts for what was actually typed, so a general
    // clinic in "Health & Dental" is not returned for "dentist" via a synonym.
    if (term === token && hasPrefix(haystack.context, term)) best = Math.max(best, 3);
    if (hasPrefix(haystack.description, term)) best = Math.max(best, 1.5 * exact);
  }
  return best;
}

function scoreListing(listing: Listing, tokens: readonly string[]): number {
  if (tokens.length === 0) return 1;
  const haystack = buildHaystack(listing);
  let total = 0;
  for (const token of tokens) {
    const score = scoreToken(haystack, token);
    if (score === 0) return 0; // every typed word must match something
    total += score;
  }
  return total;
}

function trustBoost(listing: Listing): number {
  switch (resolveVerification(listing.verification, listing.source)) {
    case "official":
      return 0.6;
    case "verified":
      return 0.4;
    case "community":
      return 0.1;
    default:
      return 0;
  }
}

export function searchListings(listings: readonly Listing[], filters: SearchFilters, now: Date): SearchResult[] {
  const tokens = tokenize(filters.query);
  const results: SearchResult[] = [];

  for (const listing of listings) {
    if (!isCurrentListing(listing, now)) continue;
    if (filters.category !== "all" && listing.category !== filters.category) continue;

    const openNow = listing.kind === "business" ? isOpenNow(listing as Business, now) : undefined;
    if (filters.openNowOnly && openNow !== true) continue;

    const score = scoreListing(listing, tokens);
    if (score === 0) continue;

    results.push({
      key: `${listing.kind}:${listing.id}`,
      type: listing.kind,
      score: score + trustBoost(listing),
      listing,
      location: toMapLocation(listing),
      openNow,
    });
  }

  return results.sort((a, b) =>
    filters.sort === "recent"
      ? b.listing.updatedAt.localeCompare(a.listing.updatedAt)
      : b.score - a.score || a.listing.title.localeCompare(b.listing.title),
  );
}
