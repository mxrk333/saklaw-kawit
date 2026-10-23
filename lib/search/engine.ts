import { findArea } from "@/data/barangay-areas";
import { CATEGORY_LABELS } from "@/data/categories";
import type { Business, CategoryId, Listing, MapLocation, SearchFilters, SearchResult } from "@/types";
import { CATEGORIES } from "@/data/categories";
import { isOpenNow } from "@/lib/utils/hours";
import { isCurrentListing, resolveVerification } from "@/lib/utils/verification";
import { normalize } from "./normalize";
import { interpretQuery } from "./query";
import { expandTerm } from "./synonyms";

export { normalize };

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

interface TokenMatch {
  score: number;
  /** The term (the typed word or one of its synonyms) that matched best. */
  term: string;
}

/** Best score any synonym earns for one query token; score 0 means no match. */
function scoreToken(haystack: Haystack, token: string): TokenMatch {
  let best: TokenMatch = { score: 0, term: token };
  const consider = (score: number, term: string) => {
    if (score > best.score) best = { score, term };
  };
  for (const term of expandTerm(token)) {
    const exact = term === token ? 1 : 0.7;
    if (hasPrefix(haystack.title, term)) consider(6 * exact, term);
    if (hasPrefix(haystack.tags, term)) consider(5 * exact, term);
    // Category/topic text only counts for what was actually typed, so a general
    // clinic in "Health & Dental" is not returned for "dentist" via a synonym.
    if (term === token && hasPrefix(haystack.context, term)) consider(3, term);
    if (hasPrefix(haystack.description, term)) consider(1.5 * exact, term);
  }
  return best;
}

function scoreListing(listing: Listing, tokens: readonly string[]): { score: number; matchedOn: string[] } {
  if (tokens.length === 0) return { score: 1, matchedOn: [] };
  const haystack = buildHaystack(listing);
  let total = 0;
  const matchedOn: string[] = [];
  for (const token of tokens) {
    const match = scoreToken(haystack, token);
    if (match.score === 0) return { score: 0, matchedOn: [] }; // every typed word must match something
    total += match.score;
    if (!matchedOn.includes(match.term)) matchedOn.push(match.term);
  }
  return { score: total, matchedOn };
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

const COFFEE_WORDS = new Set(["coffee", "cafe", "kape", "espresso", "barista", "milktea", "boba"]);

/** Coffee shops and milk-tea places, whichever category they are filed under. */
function isCoffeeShop(listing: Listing): boolean {
  if (listing.kind !== "business") return false;
  const words = [...listing.tags, listing.title].flatMap(tokenize);
  return words.some((word) => COFFEE_WORDS.has(word)) || /milk\s?tea|bubble tea/i.test(`${listing.title} ${listing.tags.join(" ")}`);
}

/**
 * Category membership. "Places & Services" is the umbrella for every place and
 * service (stores, sari-sari, water stations, offices...), and "Barangay
 * Updates" includes each barangay's page, which is where its updates are posted.
 */
export function matchesCategory(listing: Listing, category: CategoryId): boolean {
  switch (category) {
    case "all":
      return true;
    case "places":
      return listing.kind === "business";
    case "coffee":
      return isCoffeeShop(listing);
    case "barangay":
      return listing.category === "barangay" || (listing.kind === "business" && Boolean(listing.areaId));
    default:
      return listing.category === category;
  }
}

/** How many current listings each category chip will show. */
export function countByCategory(listings: readonly Listing[], now: Date): Record<CategoryId, number> {
  const current = listings.filter((listing) => isCurrentListing(listing, now));
  return Object.fromEntries(
    CATEGORIES.map((category) => [category.id, current.filter((l) => matchesCategory(l, category.id)).length]),
  ) as Record<CategoryId, number>;
}

export function searchListings(listings: readonly Listing[], filters: SearchFilters, now: Date): SearchResult[] {
  const { tokens } = interpretQuery(filters.query);
  const results: SearchResult[] = [];

  for (const listing of listings) {
    if (!isCurrentListing(listing, now)) continue;
    if (!matchesCategory(listing, filters.category)) continue;

    const openNow = listing.kind === "business" ? isOpenNow(listing as Business, now) : undefined;
    if (filters.openNowOnly && openNow !== true) continue;

    const { score, matchedOn } = scoreListing(listing, tokens);
    if (score === 0) continue;

    results.push({
      key: `${listing.kind}:${listing.id}`,
      type: listing.kind,
      score: score + trustBoost(listing),
      listing,
      location: toMapLocation(listing),
      openNow,
      matchedOn,
    });
  }

  return results.sort((a, b) =>
    filters.sort === "recent"
      ? b.listing.updatedAt.localeCompare(a.listing.updatedAt)
      : b.score - a.score || a.listing.title.localeCompare(b.listing.title),
  );
}
