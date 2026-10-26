import { describe, expect, it } from "vitest";
import { getEventStatus } from "@/lib/utils/events";
import type { CommunityEvent, WeeklyHours } from "@/types";

const nightly = Array.from({ length: 7 }, () => [{ open: "16:00", close: "24:00" }]) as unknown as WeeklyHours;
const base: CommunityEvent = {
  kind: "event",
  id: "las-tiendas",
  title: "Las Tiendas",
  description: "",
  category: "events",
  barangay: "Poblacion",
  tags: [],
  verification: "community",
  source: { name: "test" },
  isDemo: false,
  updatedAt: "2026-10-26T00:00:00+08:00",
  startsAt: "2026-10-26T16:00:00+08:00",
  endsAt: "2026-12-31T00:00:00+08:00",
  venue: "Aguinaldo Park",
  coordinates: { lat: 14.41, lng: 120.9 },
  dailyHours: nightly,
};
const at = (iso: string) => getEventStatus(base, new Date(iso));

describe("getEventStatus", () => {
  it("is live from 4 PM to midnight (Manila) on a day within the run", () => {
    expect(at("2026-11-05T16:00:00+08:00")).toBe("live");
    expect(at("2026-11-05T23:59:00+08:00")).toBe("live");
  });

  it("is on a break between nightly sessions", () => {
    expect(at("2026-11-05T00:00:00+08:00")).toBe("between");
    expect(at("2026-11-05T15:59:00+08:00")).toBe("between");
  });

  it("is upcoming before the start and ended after the end", () => {
    expect(at("2026-10-26T10:00:00+08:00")).toBe("upcoming");
    expect(at("2027-01-01T18:00:00+08:00")).toBe("ended");
  });

  it("is live for the whole run when there are no daily hours", () => {
    const allDay = { ...base, dailyHours: undefined };
    expect(getEventStatus(allDay, new Date("2026-11-05T03:00:00+08:00"))).toBe("live");
  });
});
