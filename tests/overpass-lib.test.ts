import { describe, expect, it } from "vitest";
import boundary from "@/data/generated/kawit-boundary.json";
import { toPlace } from "../scripts/osm-lib.mjs";
import { buildQuery, elementToResult } from "../scripts/overpass-lib.mjs";

const inKawit = { lat: 14.4454, lon: 120.9038 };

describe("buildQuery", () => {
  it("targets the Kawit relation as an Overpass area", () => {
    expect(buildQuery(1485548)).toContain("area(3601485548)");
  });
});

describe("elementToResult", () => {
  it("keeps named shops and reads address and contact tags", () => {
    const result = elementToResult({ type: "node", id: 1, ...inKawit, tags: { shop: "supermarket", name: "Test Mart", "addr:street": "Main St", phone: "123" } });
    expect(result).toMatchObject({ name: "Test Mart", category: "shop", type: "supermarket", address: { road: "Main St" }, extratags: { phone: "123" } });
  });

  it("keeps unnamed convenience / sari-sari stores with a generic name", () => {
    expect(elementToResult({ type: "node", id: 2, ...inKawit, tags: { shop: "variety_store" } })?.name).toBe("Sari-sari / variety store");
    expect(elementToResult({ type: "node", id: 3, ...inKawit, tags: { shop: "convenience" } })?.name).toBe("Convenience store");
  });

  it("drops unnamed places of other types and elements without a position", () => {
    expect(elementToResult({ type: "node", id: 4, ...inKawit, tags: { amenity: "bank" } })).toBeNull();
    expect(elementToResult({ type: "way", id: 5, tags: { shop: "bakery", name: "No Position" } })).toBeNull();
  });

  it("uses a way's centre and flows through toPlace into a Kawit place", () => {
    const result = elementToResult({ type: "way", id: 6, center: { lat: 14.4454, lon: 120.9038 }, tags: { shop: "variety_store" } });
    expect(toPlace(result, boundary.geometry)).toMatchObject({ name: "Sari-sari / variety store", category: "shopping" });
  });
});
