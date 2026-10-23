import { describe, expect, it } from "vitest";
import { countByCategory, searchListings } from "@/lib/search/engine";
import { interpretQuery } from "@/lib/search/query";
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

describe("natural questions", () => {
  const ids = (query: string) => search({ query }).map((r) => r.listing.id);

  it("'where can I stay in Kawit?' finds places to stay", () => {
    expect(ids("where can I stay in Kawit?")).toEqual(expect.arrayContaining(["hotel", "resort"]));
    expect(ids("where can I stay in Kawit?")).not.toContain("botika");
  });

  it("understands tourist and mall questions", () => {
    expect(ids("what are the tourist attractions?")).toContain("museum");
    expect(ids("malls in kawit")).toEqual(["mall"]);
    expect(ids("Tourist spots")).toContain("museum");
  });

  it("ignores filler words but keeps real keywords", () => {
    expect(interpretQuery("the best pharmacy near me in Kawit").tokens).toEqual(["pharmacy"]);
    expect(interpretQuery("where to eat").intents).toEqual(["Places to eat"]);
    expect(interpretQuery("where is kawit").tokens).toEqual([]);
  });

  it("reports which words matched, for display", () => {
    const results = search({ query: "resort" });
    // The resort matches the typed word; the hotel matches through the synonym "hotel".
    expect(results.find((r) => r.listing.id === "resort")?.matchedOn).toEqual(["resort"]);
    expect(results.find((r) => r.listing.id === "hotel")?.matchedOn).toEqual(["hotel"]);
  });
});

describe("categories", () => {
  it("'Places & Services' lists every place and service, not just one category", () => {
    const results = search({ category: "places" });
    expect(results.length).toBeGreaterThan(5);
    expect(results.every((r) => r.listing.kind === "business")).toBe(true);
    expect(results.map((r) => r.listing.id)).toEqual(expect.arrayContaining(["dental", "botika", "hotel", "mall"]));
  });

  it("'Barangay Updates' includes barangay pages", () => {
    expect(search({ category: "barangay" }).map((r) => r.listing.id)).toContain("barangay-hall");
  });

  it("counts match what each chip shows", () => {
    const counts = countByCategory(FIXTURES, NOW);
    for (const id of ["places", "barangay", "health", "stay"] as const) {
      expect(counts[id]).toBe(search({ category: id }).length);
    }
    expect(counts.events).toBe(0);
  });
});

describe("brand names", () => {
  it("'snr' finds S&R, and 's&r' does too", () => {
    expect(search({ query: "snr" }).map((r) => r.listing.id)).toContain("snr");
    expect(search({ query: "S&R" }).map((r) => r.listing.id)).toContain("snr");
    expect(search({ query: "s&r kawit" }).map((r) => r.listing.id)).toContain("snr");
    // The abbreviation "Sr." (senior) must not be confused with S&R.
    expect(search({ query: "snr" }).map((r) => r.listing.id)).not.toContain("sr-pedro");
  });
});

describe("coffee, hospitals and police", () => {
  const ids = (query: string) => search({ query }).map((r) => r.listing.id);

  it("finds each by name or local word", () => {
    expect(ids("coffee shop")).toContain("cafe");
    expect(ids("kape")).toContain("cafe");
    expect(ids("hospital")).toContain("hospital");
    expect(ids("police station")).toContain("police");
    expect(ids("pulis")).toContain("police");
  });

  it("'emergency' lists emergency services", () => {
    expect(ids("emergency")).toEqual(expect.arrayContaining(["hospital", "police"]));
  });

  it("a hospital is not a coffee shop", () => {
    expect(ids("coffee shop")).not.toContain("hospital");
  });
});

describe("Coffee & Tea category", () => {
  it("lists coffee shops whichever category they are filed under, and nothing else", () => {
    const ids = search({ category: "coffee" }).map((r) => r.listing.id);
    expect(ids).toEqual(expect.arrayContaining(["cafe", "kape"]));
    expect(ids).not.toContain("roasters"); // "Roasters" is not coffee
    expect(ids).not.toContain("hospital");
  });

  it("has a chip count that matches", () => {
    expect(countByCategory(FIXTURES, NOW).coffee).toBe(search({ category: "coffee" }).length);
  });
});
