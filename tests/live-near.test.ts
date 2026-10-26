import { describe, expect, it } from "vitest";
import { findLiveNear } from "@/lib/map/live";
import type { MapLocation } from "@/types";

const loc = (over: Partial<MapLocation>): MapLocation => ({
  key: "k", type: "business", id: "i", title: "t", categoryLabel: "c",
  coordinates: { lat: 14.446463, lng: 120.906859 }, precision: "exact", ...over,
});

describe("findLiveNear", () => {
  const event = loc({ key: "event:e", type: "event", live: true, title: "Enchanted Christmas" });
  it("links a venue to the live event at the same spot", () => {
    expect(findLiveNear(loc({}), [event])).toBe(event);
  });
  it("ignores far-away events and non-live ones", () => {
    expect(findLiveNear(loc({ coordinates: { lat: 14.42, lng: 120.9 } }), [event])).toBeUndefined();
    expect(findLiveNear(loc({}), [{ ...event, live: false }])).toBeUndefined();
  });
  it("never treats a barangay-area pin as the event's spot", () => {
    expect(findLiveNear(loc({ precision: "area" }), [event])).toBeUndefined();
  });
});
