import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseRawSources, titleCaseName } from "../scripts/parse-raw-sources.mjs";

describe("titleCaseName", () => {
  it("normalises capitalisation", () => {
    expect(titleCaseName("balsahan-Bisita")).toBe("Balsahan-Bisita");
    expect(titleCaseName("batong dalig")).toBe("Batong Dalig");
  });
});

describe("parseRawSources", () => {
  it("reads names, urls, phone numbers and notes", () => {
    const { sources, warnings } = parseRawSources(
      ["# gahak", "https://example.com/a", "Barangay Hall Landline: (046) 434 2404", "", "# kaingen ", "(046) 438-3248"].join("\n"),
    );
    expect(warnings).toEqual([]);
    expect(sources[0]).toMatchObject({ id: "gahak", urls: ["https://example.com/a"], phone: "(046) 434 2404", phoneNote: "Barangay Hall Landline" });
    expect(sources[1]).toMatchObject({ name: "Kaingen", phone: "(046) 438-3248" });
  });

  it("reads geo lines and rejects coordinates outside the Philippines", () => {
    const ok = parseRawSources("# a\nhttps://x.test\ngeo: 14.4458, 120.9052");
    expect(ok.sources[0].geo).toEqual({ lat: 14.4458, lng: 120.9052 });
    const bad = parseRawSources("# a\nhttps://x.test\ngeo: 51.5, -0.12");
    expect(bad.sources[0].geo).toBeUndefined();
    expect(bad.warnings).toHaveLength(1);
  });

  it("never drops content silently", () => {
    const { sources, warnings } = parseRawSources("stray line\n# a\nNo Facebook page");
    expect(warnings).toHaveLength(1); // stray line before the first heading
    expect(sources[0].notes).toEqual(["No Facebook page"]);
  });

  it("parses the real data/rawsources.md without warnings", () => {
    const { sources, warnings } = parseRawSources(readFileSync("data/rawsources.md", "utf8"));
    expect(warnings).toEqual([]);
    expect(sources.length).toBeGreaterThan(0);
  });
});
