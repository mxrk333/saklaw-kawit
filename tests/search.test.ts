import { describe, expect, it } from "vitest";
import { searchListings } from "@/lib/search/engine";
import { getSuggestions } from "@/lib/search/suggestions";
import type { SearchFilters } from "@/types";
import { FIXTURES } from "./fixtures";

const ALL = FIXTURES;
const NOW = new Date();
const base: SearchFilters = { query: "", category: "all", openNowOnly: false, sort: "relevance" };
const search = (overrides: Partial<SearchFilters>) => searchListings(ALL, { ...base, ...overrides }, NOW);

describe("searchListings", () => {
  it("finds dentists and dental clinics for 'dentist'", () => {
    const titles = search({ query: "dentist" }).map((r) => r.listing.title);
    expect(titles).toHaveLength(2);
    expect(titles.every((t) => /dental/i.test(t))).toBe(true);
  });

  it("maps 'curfew' to the curfew announcement", () => {
    const results = search({ query: "curfew" });
    expect(results[0]?.listing.id).toBe("curfew");
  });

  it("maps 'road closure' to traffic advisories and hides expired ones", () => {
    const ids = search({ query: "road closure" }).map((r) => r.listing.id);
    expect(ids).toContain("closure-active");
    expect(ids).not.toContain("closure-expired");
  });

  it("understands Filipino terms like 'botika'", () => {
    expect(search({ query: "botika" }).some((r) => r.listing.category === "shopping")).toBe(true);
  });

  it("requires every typed word to match", () => {
    expect(search({ query: "dentist zzzz" })).toHaveLength(0);
  });

  it("never returns expired announcements or past events", () => {
    const ids = search({}).map((r) => r.listing.id);
    expect(ids).not.toContain("closure-expired");
    expect(ids).not.toContain("past-event");
  });

  it("filters by category", () => {
    const results = search({ category: "schools" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.listing.category === "schools")).toBe(true);
  });

  it("open-now filter never returns listings without confirmed hours", () => {
    for (const result of search({ openNowOnly: true })) {
      expect(result.listing.id).toBe("dental");
      expect(result.openNow).toBe(true);
    }
  });
});

describe("getSuggestions", () => {
  it("offers defaults for empty input and prefix matches otherwise", () => {
    expect(getSuggestions("", ALL).length).toBeGreaterThan(0);
    expect(getSuggestions("den", ALL).some((s) => /dent/i.test(s))).toBe(true);
  });
});
