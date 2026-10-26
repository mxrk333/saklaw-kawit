import { describe, expect, it } from "vitest";
import { parseHours, parsePlaces } from "../scripts/parse-places.mjs";

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

describe("parseHours", () => {
  it("expands 'daily' to every day, with midnight as 24:00", () => {
    const { hours, error } = parseHours("daily 16:00-24:00");
    expect(error).toBeUndefined();
    expect(hours).toHaveLength(7);
    for (const day of hours ?? []) expect(day).toEqual([{ open: "16:00", close: "24:00" }]);
  });

  it("reads day ranges, several windows, and closed days", () => {
    const { hours } = parseHours("mon-fri 09:00-12:00, 13:00-17:00; sat 10:00-14:00; sun closed");
    expect(hours?.[0]).toEqual([]); // Sunday
    expect(hours?.[1]).toEqual([{ open: "09:00", close: "12:00" }, { open: "13:00", close: "17:00" }]);
    expect(hours?.[5]).toEqual(hours?.[1]);
    expect(hours?.[6]).toEqual([{ open: "10:00", close: "14:00" }]);
  });

  it("rejects hours that do not cover all seven days or are malformed", () => {
    expect(parseHours("mon-fri 09:00-17:00").error).toMatch(/every day/i);
    expect(parseHours("daily 25:00-26:00").error).toBeDefined();
    expect(parseHours("someday 09:00-17:00").error).toBeDefined();
  });

  it("is used by parsePlaces and warns on bad hours", () => {
    const ok = parsePlaces("# A\ngeo: 14.44, 120.9\nhours: daily 16:00-24:00");
    expect(ok.warnings).toEqual([]);
    expect(ok.places[0].hours).toHaveLength(7);
    expect(parsePlaces("# A\ngeo: 14.44, 120.9\nhours: nope").warnings.length).toBe(1);
  });
});
