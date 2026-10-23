import { describe, expect, it } from "vitest";
import { parsePlaces } from "../scripts/parse-places.mjs";

describe("parsePlaces", () => {
  it("reads a place with all fields", () => {
    const { places, warnings } = parsePlaces(
      ["# Aling Nena Store", "type: sari-sari store", "tags: tindahan, sari-sari", "geo: 14.4458, 120.9052", "barangay: Poblacion", "source: https://example.com/x"].join("\n"),
    );
    expect(warnings).toEqual([]);
    expect(places[0]).toMatchObject({
      id: "aling-nena-store",
      category: "places",
      geo: { lat: 14.4458, lng: 120.9052 },
      barangay: "Poblacion",
      source: "https://example.com/x",
    });
    expect(places[0].tags).toEqual(["sari-sari store", "tindahan", "sari-sari"]);
  });

  it("ignores documentation and indented examples", () => {
    const { places } = parsePlaces("Intro text\n\n    # Not a place\n    geo: 1, 2\n\n# Real place\ngeo: 14.44, 120.9");
    expect(places.map((p) => p.name)).toEqual(["Real place"]);
  });

  it("warns instead of dropping bad input", () => {
    const { warnings } = parsePlaces("# A\ncategory: nonsense\ngeo: 51.5, -0.1\nwhat is this");
    expect(warnings.length).toBe(4); // category, geo, unknown line, and no usable geo
  });

  it("parses the real data/places.md without warnings", async () => {
    const { readFileSync } = await import("node:fs");
    expect(parsePlaces(readFileSync("data/places.md", "utf8")).warnings).toEqual([]);
  });
});
