import { describe, expect, it } from "vitest";
import { circlePolygon, userFeatureCollection } from "@/lib/map/geojson";
import { isInsideKawit } from "@/lib/map/kawit";
import { haversineMeters } from "@/lib/utils/geo";

describe("circlePolygon", () => {
  it("draws a closed ring whose points sit at the requested radius", () => {
    const polygon = circlePolygon(120.905, 14.445, 50);
    const ring = polygon.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    for (const [lng, lat] of ring) {
      expect(haversineMeters({ lat: 14.445, lng: 120.905 }, { lat, lng })).toBeCloseTo(50, 0);
    }
  });
});

describe("userFeatureCollection", () => {
  it("is empty without a fix and has a dot plus accuracy ring with one", () => {
    expect(userFeatureCollection(null).features).toHaveLength(0);
    const fc = userFeatureCollection({ coordinates: { lat: 14.445, lng: 120.905 }, accuracy: 20 });
    expect(fc.features.map((f) => f.properties?.kind).sort()).toEqual(["accuracy", "dot"]);
  });
});

describe("isInsideKawit", () => {
  it("separates Kawit from elsewhere", () => {
    expect(isInsideKawit({ lat: 14.4454, lng: 120.9038 })).toBe(true);
    expect(isInsideKawit({ lat: 14.5995, lng: 120.9842 })).toBe(false);
  });
});

import { BARANGAY_AREAS, findArea } from "@/data/barangay-areas";
import { toMapLocation } from "@/lib/search/engine";
import type { Business } from "@/types";

describe("barangay areas", () => {
  it("every area centre is inside Kawit", () => {
    expect(BARANGAY_AREAS.length).toBeGreaterThan(0);
    for (const area of BARANGAY_AREAS) expect(isInsideKawit(area.center), area.name).toBe(true);
  });

  it("area-only listings get a hollow area pin, exact ones an exact pin", () => {
    const base = { kind: "business", id: "x", title: "X", category: "government" } as unknown as Business;
    const area = BARANGAY_AREAS[0];
    expect(toMapLocation({ ...base, areaId: area.id })).toMatchObject({ precision: "area", coordinates: area.center, areaId: area.id });
    expect(toMapLocation({ ...base, coordinates: { lat: 14.44, lng: 120.9 }, areaId: area.id })?.precision).toBe("exact");
    expect(toMapLocation(base)).toBeUndefined();
    expect(findArea("nope")).toBeUndefined();
  });
});
