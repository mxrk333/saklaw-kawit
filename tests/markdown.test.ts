import { describe, expect, it } from "vitest";
import { parseMarkdown, splitBold } from "@/lib/utils/markdown";
import { parsePlaces } from "../scripts/parse-places.mjs";

describe("parseMarkdown", () => {
  it("splits headings, bullet lists and paragraphs", () => {
    expect(parseMarkdown("## Food\n- one\n- two\n\nHello\nworld")).toEqual([
      { type: "heading", text: "Food" },
      { type: "list", items: ["one", "two"] },
      { type: "paragraph", text: "Hello world" },
    ]);
  });

  it("marks **bold** parts", () => {
    expect(splitBold("a **b** c")).toEqual([
      { text: "a ", bold: false },
      { text: "b", bold: true },
      { text: " c", bold: false },
    ]);
  });
});

describe("places.md about continuation", () => {
  it("joins + lines onto the about key", () => {
    const { places, warnings } = parsePlaces("# X\ngeo: 14.44, 120.9\nabout: ## Hi\n+- a\n+\n+- b\nnote: after");
    expect(warnings).toEqual([]);
    expect(places[0].about).toBe("## Hi\n- a\n\n- b");
    expect(places[0].note).toBe("after");
  });
});
