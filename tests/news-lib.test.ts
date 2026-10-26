import { describe, expect, it } from "vitest";
import { classifyItem, parseRss, selectItems } from "../scripts/news-lib.mjs";

const NOW = new Date("2026-10-26T00:00:00Z");
const item = (title: string, daysAgo = 1, source = "Manila Bulletin") => ({
  title: `${title} - ${source}`,
  link: `https://news.example.com/${encodeURIComponent(title)}`,
  source,
  publishedAt: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
});

describe("parseRss", () => {
  it("reads title, link, source and date, decoding entities", () => {
    const xml = `<rss><channel><item><title>Kawit&#39;s Christmas &amp; lights - GMA</title><link>https://n.example/a</link>
      <pubDate>Mon, 26 Oct 2026 01:00:00 GMT</pubDate><source url="https://gma.example">GMA</source></item></channel></rss>`;
    expect(parseRss(xml)).toEqual([
      { title: "Kawit's Christmas & lights - GMA", link: "https://n.example/a", source: "GMA", publishedAt: "2026-10-26T01:00:00.000Z" },
    ]);
  });

  it("skips items without a usable link or date", () => {
    expect(parseRss("<rss><item><title>x</title></item></rss>")).toEqual([]);
  });
});

describe("classifyItem", () => {
  it("accepts Kawit events, traffic and community news with the right topic", () => {
    expect(classifyItem(item("Kawit Christmas festival opens at Aguinaldo Park"))).toMatchObject({ ok: true, category: "events" });
    expect(classifyItem(item("Road closure in Kawit, Cavite this weekend"))).toMatchObject({ ok: true, category: "traffic", topic: "traffic" });
    expect(classifyItem(item("New scholarship program launched for Kawit students"))).toMatchObject({ ok: true, category: "barangay" });
  });

  it("rejects crime and violence, in English and Filipino", () => {
    for (const title of [
      "Man shot dead in Kawit, Cavite",
      "Suspect nabbed in Kawit buy-bust operation",
      "Kawit robbery leaves two injured",
      "Binaril sa Kawit, patay",
      "Kawit festival marred by stabbing",
    ]) {
      expect(classifyItem(item(title)), title).toMatchObject({ ok: false, reason: "blocked" });
    }
  });

  it("rejects items that do not mention Kawit or have no useful topic", () => {
    expect(classifyItem(item("Cavitex toll fees to increase for all vehicles"))).toMatchObject({ ok: false, reason: "not-kawit" });
    expect(classifyItem(item("Kawit councilor attends conference in Cebu"))).toMatchObject({ ok: false, reason: "no-topic" });
  });

  it("does not block harmless words that merely start like a blocked one", () => {
    expect(classifyItem(item("Robinsons Kawit mall opens new cafe"))).toMatchObject({ ok: true });
    expect(classifyItem(item("Kawit diet and health program for seniors"))).toMatchObject({ ok: true });
    expect(classifyItem(item("Gunita exhibit opens at Kawit heritage museum"))).toMatchObject({ ok: true });
  });

  it("does not let 'Kawit' match inside another word", () => {
    expect(classifyItem(item("Kawitan festival road closure"))).toMatchObject({ ok: false, reason: "not-kawit" });
  });
});

describe("selectItems", () => {
  it("keeps recent accepted items, newest first, with stable ids and clean titles", () => {
    const picked = selectItems(
      [item("Kawit festival opens", 5), item("Kawit festival opens", 5), item("Kawit road closure", 1), item("Kawit festival old", 40), item("Man shot in Kawit festival", 1)],
      NOW,
    );
    expect(picked.map((p: { title: string }) => p.title)).toEqual(["Kawit road closure", "Kawit festival opens"]);
    expect(picked[0].id).toMatch(/^[a-z0-9]{10}$/);
  });
});
