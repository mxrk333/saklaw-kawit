/**
 * Fetches recent Kawit headlines from Google News RSS, keeps only safe and relevant ones
 * (see news-lib.mjs: no crime or violence), and writes data/news.json.
 * Run by .github/workflows/fetch-news.yml, which opens a pull request: merging it is the review step.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { MAX_AGE_DAYS, parseRss, selectItems } from "./news-lib.mjs";

const OUTPUT = new URL("../data/news.json", import.meta.url);
const QUERIES = [`"Kawit" Cavite when:${MAX_AGE_DAYS}d`, `"Kawit, Cavite" when:${MAX_AGE_DAYS}d`];
const USER_AGENT = "saklaw-news/0.1 (+https://github.com/mxrk333/saklaw-kawit)";

async function fetchFeed(query) {
  const url = `https://news.google.com/rss/search?${new URLSearchParams({ q: query, hl: "en-PH", gl: "PH", ceid: "PH:en" })}`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Google News returned ${response.status} for ${query}`);
  return parseRss(await response.text());
}

function readExisting() {
  try {
    return JSON.parse(readFileSync(OUTPUT, "utf8")).items ?? [];
  } catch {
    return [];
  }
}

const now = new Date();
const fetched = (await Promise.all(QUERIES.map(fetchFeed))).flat();
// Earlier items are re-checked with today's rules, and drop out once they are too old.
const items = selectItems([...fetched, ...readExisting()], now);
writeFileSync(OUTPUT, `${JSON.stringify({ fetchedAt: now.toISOString(), source: "Google News RSS", items }, null, 2)}\n`);
console.log(`[fetch-news] ${fetched.length} headlines fetched, ${items.length} kept -> data/news.json`);
