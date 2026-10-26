import type { CommunityEvent, WeeklyHours } from "@/types";

/** Every day, 4 PM to midnight (Asia/Manila). */
const NIGHTLY_4PM_TO_MIDNIGHT = Array.from({ length: 7 }, () => [{ open: "16:00", close: "24:00" }]) as unknown as WeeklyHours;

/**
 * Only real events with a named source belong here. Details marked "reported"
 * were taken from the organiser's public page and have not been confirmed by SAKLAW.
 */
export const EVENTS: readonly CommunityEvent[] = [
  {
    kind: "event",
    id: "las-tiendas-enchanted-christmas",
    title: "Enchanted Christmas at Las Tiendas",
    description:
      "Night market and food court in Aguinaldo Park, across from the Aguinaldo Shrine. Open daily 4 PM to 12 AM until December 30, 2026. Reported highlights: about two dozen food stalls (ihaw-ihaw, chicken tenders, pizza, wings, juices, baked treats), kids' inflatables, trampolines and carnival games, live local bands, affordable clothes, toys and fragrance stalls, and festive holiday lights.",
    category: "events",
    barangay: "Kaingen",
    tags: ["las tiendas", "christmas", "night market", "food court", "festival", "live music", "kids"],
    verification: "community",
    source: { name: "Las Tiendas Kawit on Facebook", url: "https://www.facebook.com/lastiendaskawit/" },
    isDemo: false,
    updatedAt: "2026-10-26T00:00:00+08:00",
    startsAt: "2026-10-26T16:00:00+08:00",
    endsAt: "2026-12-31T00:00:00+08:00",
    venue: "Aguinaldo Park, Kawit",
    coordinates: { lat: 14.446463, lng: 120.906859 },
    dailyHours: NIGHTLY_4PM_TO_MIDNIGHT,
  },
];
