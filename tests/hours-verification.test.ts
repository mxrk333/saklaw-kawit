import { describe, expect, it } from "vitest";
import { isOpenNow } from "@/lib/utils/hours";
import { isCurrentAnnouncement, resolveVerification } from "@/lib/utils/verification";
import type { Announcement } from "@/types";
import { DENTAL_FIXTURE } from "./fixtures";

const dental = DENTAL_FIXTURE; // Mon–Sat 09:00–18:00
// 2026-10-26 is a Monday. 02:00Z = 10:00 Manila, 12:00Z = 20:00 Manila.
const monday10am = new Date("2026-10-26T02:00:00Z");
const monday8pm = new Date("2026-10-26T12:00:00Z");
const sunday10am = new Date("2026-10-25T02:00:00Z");

describe("isOpenNow", () => {
  it("uses Asia/Manila time", () => {
    expect(isOpenNow(dental, monday10am)).toBe(true);
    expect(isOpenNow(dental, monday8pm)).toBe(false);
    expect(isOpenNow(dental, sunday10am)).toBe(false);
  });

  it("refuses to answer when hours are missing or have no known source", () => {
    expect(isOpenNow({ ...dental, hoursVerified: false }, monday10am)).toBeUndefined();
    expect(isOpenNow({ ...dental, hours: undefined }, monday10am)).toBeUndefined();
  });

  it("uses OpenStreetMap hours, which the UI labels as possibly out of date", () => {
    const osm = { ...dental, hoursVerified: false, hoursSource: "osm" as const };
    expect(isOpenNow(osm, monday10am)).toBe(true);
    expect(isOpenNow(osm, monday8pm)).toBe(false);
  });
});

describe("resolveVerification", () => {
  it("downgrades 'official' when the source is not verified", () => {
    expect(resolveVerification("official", { name: "Someone" })).toBe("unverified");
    expect(resolveVerification("official", { name: "LGU", verifiedBy: "mod", verifiedAt: "2026-01-01" })).toBe("official");
    expect(resolveVerification("community", { name: "x" })).toBe("community");
  });
});

describe("isCurrentAnnouncement", () => {
  const base = { publishedAt: "2026-01-01T00:00:00Z" } as Announcement;
  it("treats past expiry as not current", () => {
    expect(isCurrentAnnouncement({ ...base, expiresAt: "2026-01-02T00:00:00Z" }, new Date("2026-02-01"))).toBe(false);
    expect(isCurrentAnnouncement({ ...base, expiresAt: "2026-03-01T00:00:00Z" }, new Date("2026-02-01"))).toBe(true);
    expect(isCurrentAnnouncement(base, new Date("2030-01-01"))).toBe(true);
  });
});
