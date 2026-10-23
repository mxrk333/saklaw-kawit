import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DATA_CREDITS, SOFTWARE_CREDITS } from "@/data/credits";

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies: Record<string, string> };

describe("credits", () => {
  it("credits every direct dependency", () => {
    const credited = new Set(SOFTWARE_CREDITS.map((c) => c.pkg));
    const missing = Object.keys(pkg.dependencies).filter((name) => !credited.has(name));
    expect(missing).toEqual([]);
  });

  it("gives every credit an owner, licence and link", () => {
    for (const credit of [...SOFTWARE_CREDITS, ...DATA_CREDITS]) {
      expect(credit.by.length, credit.name).toBeGreaterThan(0);
      expect(credit.license.length, credit.name).toBeGreaterThan(0);
      expect(credit.url, credit.name).toMatch(/^https:\/\//);
    }
  });
});
