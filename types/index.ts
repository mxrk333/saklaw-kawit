export type CategoryId =
  | "all"
  | "places"
  | "food"
  | "health"
  | "shopping"
  | "government"
  | "barangay"
  | "schools"
  | "events"
  | "traffic";

export interface Category {
  id: CategoryId;
  label: string;
  /** Lucide icon name, resolved in the UI layer so data stays framework-free. */
  icon: string;
  /** Free-text hint used for search suggestions. */
  hint: string;
}

export type ContentType = "business" | "announcement" | "event";

/**
 * - official: published by a government body AND the source has been verified
 * - verified: reviewed by SAKLAW moderators against a reliable source
 * - community: submitted by a community member, not yet reviewed
 * - unverified: no verification metadata
 */
export type VerificationStatus = "official" | "verified" | "community" | "unverified";

export interface SourceInfo {
  name: string;
  url?: string;
  /** Who confirmed the source. Required for `official` to be honoured. */
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TimeRange {
  /** 24h "HH:mm" in Asia/Manila local time. */
  open: string;
  close: string;
}

/** Index 0 = Sunday ... 6 = Saturday. Empty array means closed that day. */
export type WeeklyHours = readonly [
  readonly TimeRange[],
  readonly TimeRange[],
  readonly TimeRange[],
  readonly TimeRange[],
  readonly TimeRange[],
  readonly TimeRange[],
  readonly TimeRange[],
];

interface BaseEntity {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  barangay: string;
  tags: readonly string[];
  verification: VerificationStatus;
  source: SourceInfo;
  /** True for sample content that must be labelled as demonstration data. */
  isDemo: boolean;
  updatedAt: string;
}

export interface Business extends BaseEntity {
  kind: "business";
  address: string;
  /** Exact location. Omitted until one is verified; such listings get no directions. */
  coordinates?: Coordinates;
  /** Barangay area (data/barangay-areas.ts) shown on the map when there is no exact location. */
  areaId?: string;
  phone?: string;
  website?: string;
  images: readonly string[];
  /** Hours are only used for open/closed status when `hoursVerified` is true. */
  hours?: WeeklyHours;
  hoursVerified: boolean;
  lastVerifiedAt?: string;
  recommendations: readonly Recommendation[];
}

export interface Recommendation {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Announcement extends BaseEntity {
  kind: "announcement";
  publishedAt: string;
  expiresAt?: string;
  coordinates?: Coordinates;
  /** Stable subtype so search can map "curfew" or "road closure" to it. */
  topic: "announcement" | "ordinance" | "curfew" | "road-closure" | "traffic" | "school" | "service";
}

export interface CommunityEvent extends BaseEntity {
  kind: "event";
  startsAt: string;
  endsAt?: string;
  venue: string;
  coordinates: Coordinates;
}

export type Listing = Business | Announcement | CommunityEvent;

export interface MapLocation {
  /** `${type}:${id}` — unique across content types. */
  key: string;
  type: ContentType;
  id: string;
  title: string;
  categoryLabel: string;
  address?: string;
  coordinates: Coordinates;
  /** "area" means the pin marks the middle of a barangay, not a specific building. */
  precision: "exact" | "area";
  /** Barangay area to outline on the map when this location is selected. */
  areaId?: string;
}

export interface SearchResult {
  key: string;
  type: ContentType;
  score: number;
  listing: Listing;
  /** Present when the listing has coordinates. */
  location?: MapLocation;
  /** Computed at search time; undefined when no verified hours exist. */
  openNow?: boolean;
}

export type SortMode = "relevance" | "recent";

export interface SearchFilters {
  query: string;
  category: CategoryId;
  openNowOnly: boolean;
  sort: SortMode;
}

export type ReportReason = "wrong-info" | "closed" | "duplicate" | "inappropriate" | "other";

export type ModerationStatus = "pending" | "approved" | "rejected";
