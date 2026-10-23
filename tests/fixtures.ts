import type { Announcement, Business, CommunityEvent, Listing } from "@/types";

/** Synthetic listings used only by tests. Not shipped in the app. */
const DAY = 86_400_000;
const at = (days: number) => new Date(Date.now() + days * DAY).toISOString();
const source = { name: "test fixture" };

const business = (b: Partial<Business> & Pick<Business, "id" | "title" | "category" | "tags">): Business => ({
  kind: "business",
  description: "fixture",
  barangay: "Test",
  address: "Test address",
  images: [],
  recommendations: [],
  hoursVerified: false,
  verification: "unverified",
  source,
  isDemo: false,
  updatedAt: at(-1),
  ...b,
});

const announcement = (a: Partial<Announcement> & Pick<Announcement, "id" | "title" | "category" | "topic" | "tags">): Announcement => ({
  kind: "announcement",
  description: "fixture",
  barangay: "Test",
  verification: "unverified",
  source,
  isDemo: false,
  publishedAt: at(-2),
  updatedAt: at(-2),
  ...a,
});

const monToSat = [[], [{ open: "09:00", close: "18:00" }], [{ open: "09:00", close: "18:00" }], [{ open: "09:00", close: "18:00" }], [{ open: "09:00", close: "18:00" }], [{ open: "09:00", close: "18:00" }], [{ open: "09:00", close: "18:00" }]] as const;

export const DENTAL_FIXTURE = business({
  id: "dental",
  title: "Fixture Dental Clinic",
  category: "health",
  tags: ["dentist", "dental", "clinic"],
  hours: monToSat,
  hoursVerified: true,
});

export const FIXTURES: readonly Listing[] = [
  DENTAL_FIXTURE,
  business({ id: "dental-2", title: "Fixture Family Dental", category: "health", tags: ["dentist", "dental"] }),
  business({ id: "clinic", title: "Fixture Health Clinic", category: "health", tags: ["clinic", "doctor"] }),
  business({ id: "botika", title: "Fixture Botika", category: "shopping", tags: ["pharmacy", "botika"] }),
  business({ id: "hotel", title: "Fixture Seaside Hotel", category: "stay", tags: ["hotel", "stay", "accommodation", "lodging"] }),
  business({ id: "resort", title: "Fixture Garden Resort", category: "stay", tags: ["hotel", "stay", "resort"] }),
  business({ id: "museum", title: "Fixture Heritage Museum", category: "attractions", tags: ["attraction", "tourist spot", "museum", "landmark"] }),
  business({ id: "mall", title: "Fixture Town Mall", category: "shopping", tags: ["mall", "shopping mall", "shopping"] }),
  business({ id: "barangay-hall", title: "Fixture Barangay Hall", category: "government", tags: ["barangay"], areaId: "gahak" }),
  business({ id: "snr", title: "S&R Kawit", category: "shopping", tags: ["wholesale", "warehouse", "supermarket"] }),
  business({ id: "sr-pedro", title: "Lechon Manok ni Sr. Pedro", category: "food", tags: ["restaurant", "fast food"] }),
  business({ id: "cafe", title: "Fixture Coffee House", category: "food", tags: ["coffee", "coffee shop", "cafe", "kape", "food"] }),
  business({ id: "kape", title: "Fixture Kapehan", category: "places", tags: ["coffee shop"] }),
  business({ id: "roasters", title: "Fixture Roasters", category: "food", tags: ["restaurant", "fast food"] }),
  business({ id: "hospital", title: "Fixture Medical Center", category: "health", phone: "+63 46 000 0000", tags: ["hospital", "emergency", "medical", "health"] }),
  business({ id: "police", title: "Fixture Police Station", category: "government", phone: "+63 46 111 1111", tags: ["police", "police station", "pulis", "emergency", "government"] }),
  business({ id: "school", title: "Fixture Elementary School", category: "schools", tags: ["school", "elementary"] }),
  announcement({
    id: "curfew",
    title: "Fixture curfew notice",
    category: "government",
    topic: "curfew",
    tags: ["curfew", "ordinance"],
  }),
  announcement({
    id: "closure-active",
    title: "Fixture road closure",
    category: "traffic",
    topic: "road-closure",
    tags: ["road closure", "traffic"],
    expiresAt: at(3),
  }),
  announcement({
    id: "closure-expired",
    title: "Fixture expired road closure",
    category: "traffic",
    topic: "road-closure",
    tags: ["road closure", "traffic"],
    expiresAt: at(-3),
  }),
  {
    kind: "event",
    id: "past-event",
    title: "Fixture past event",
    description: "fixture",
    category: "events",
    barangay: "Test",
    tags: ["past"],
    verification: "unverified",
    source,
    isDemo: false,
    updatedAt: at(-10),
    startsAt: at(-9),
    endsAt: at(-8),
    venue: "Test",
    coordinates: { lat: 14.44, lng: 120.9 },
  } satisfies CommunityEvent,
];
