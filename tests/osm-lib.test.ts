import { describe, expect, it } from "vitest";
import boundary from "@/data/generated/kawit-boundary.json";
import { classifyPlace, pointInGeometry, toPlace } from "../scripts/osm-lib.mjs";

const geometry = boundary.geometry;

describe("pointInGeometry", () => {
  it("accepts a point in Kawit and rejects points in Manila and Bacoor Bay", () => {
    expect(pointInGeometry(120.9038, 14.4454, geometry)).toBe(true); // Poblacion barangay hall
    expect(pointInGeometry(120.98, 14.6, geometry)).toBe(false); // Manila
    expect(pointInGeometry(120.9, 14.5, geometry)).toBe(false); // north of Kawit
  });
});

describe("classifyPlace", () => {
  it("maps the common local places", () => {
    expect(classifyPlace({ category: "amenity", type: "pharmacy", name: "Mercury Drug" })?.tags).toContain("botika");
    expect(classifyPlace({ category: "amenity", type: "marketplace", name: "Binakayan Market" })?.tags).toContain("talipapa");
    expect(classifyPlace({ category: "shop", type: "variety_store", name: "Sari-sari Store" })?.tags).toContain("sari-sari");
    expect(classifyPlace({ category: "shop", type: "beverages", name: "Lemon Twist Water Station" })?.tags).toContain("water station");
  });

  it("drops anything unrelated", () => {
    expect(classifyPlace({ category: "highway", type: "residential", name: "Some Road" })).toBeNull();
  });
});

describe("toPlace", () => {
  const result = { osm_type: "node", osm_id: 1, name: "Test Pharmacy", category: "amenity", type: "pharmacy", lat: "14.4454", lon: "120.9038", address: { suburb: "Poblacion" } };

  it("keeps named places inside Kawit", () => {
    expect(toPlace(result, geometry)).toMatchObject({ name: "Test Pharmacy", barangay: "Poblacion", category: "shopping" });
  });

  it("rejects unnamed places and places outside Kawit", () => {
    expect(toPlace({ ...result, name: "" }, geometry)).toBeNull();
    expect(toPlace({ ...result, lat: "14.6", lon: "120.98" }, geometry)).toBeNull();
  });
});
