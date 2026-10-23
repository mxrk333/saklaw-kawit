import { describe, expect, it } from "vitest";
import osm from "@/data/generated/osm-places.json";
import { parseOpeningHours } from "../scripts/osm-lib.mjs";

const range = (open: string, close: string) => [{ open, close }];

describe("parseOpeningHours", () => {
  it("parses 24/7 and simple day ranges (index 0 = Sunday)", () => {
    expect(parseOpeningHours("24/7")?.every((d: unknown[]) => d.length === 1)).toBe(true);
    const week = parseOpeningHours("Mo-Sa 08:00-20:00");
    expect(week?.[0]).toEqual([]);
    expect(week?.[1]).toEqual(range("08:00", "20:00"));
    expect(week?.[6]).toEqual(range("08:00", "20:00"));
  });

  it("applies later rules over earlier ones, lists, split shifts and 'off'", () => {
    const week = parseOpeningHours("Mo-Fr 08:00-17:00; Sa 08:00-12:00; Su off");
    expect(week?.[1]).toEqual(range("08:00", "17:00"));
    expect(week?.[6]).toEqual(range("08:00", "12:00"));
    expect(week?.[0]).toEqual([]);
    expect(parseOpeningHours("Mo,We,Fr 9:00-18:00")?.[3]).toEqual(range("09:00", "18:00"));
    expect(parseOpeningHours("Mo-Su 06:00-12:00, 13:00-22:00")?.[2]).toEqual([
      { open: "06:00", close: "12:00" },
      { open: "13:00", close: "22:00" },
    ]);
  });

  it("returns null for anything it cannot fully understand", () => {
    for (const text of ["", "Mo-Fr 08:00-17:00; PH off", "sunrise-sunset", "Jan-Mar Mo 08:00-17:00", "by appointment"]) {
      expect(parseOpeningHours(text), text).toBeNull();
    }
  });

  it("every parsed hour in the imported data is a well-formed week", () => {
    for (const place of osm.places as Array<{ name: string; hours?: unknown[][] }>) {
      if (!place.hours) continue;
      expect(place.hours, place.name).toHaveLength(7);
    }
  });
});
