import { describe, expect, it } from "vitest";
import { NEWS_ANNOUNCEMENTS } from "@/data/news";
import { classifyItem } from "../scripts/news-lib.mjs";

describe("NEWS_ANNOUNCEMENTS", () => {
  it("only contains items that pass today's safety filter, and none are marked verified", () => {
    for (const news of NEWS_ANNOUNCEMENTS) {
      const verdict = classifyItem({ title: news.title, source: "", link: "", publishedAt: news.publishedAt });
      expect(verdict.ok, news.title).toBe(true);
      expect(news.verification).toBe("unverified");
      expect(news.source.url).toMatch(/^https:\/\//);
    }
  });
});
