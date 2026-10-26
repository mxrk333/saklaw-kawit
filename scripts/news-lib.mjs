/**
 * Picks safe, relevant Kawit news from an RSS feed. Everything here is pure so it can be tested.
 * Only headline, source and link are kept: never article text. Anything about crime or violence is dropped.
 */
import { createHash } from "node:crypto";

export const MAX_AGE_DAYS = 14;

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'" };
const decode = (text) => text.replace(/&(?:amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m]).trim();
const tag = (block, name) => {
  const match = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(block);
  return match ? decode(match[1].replace(/^<!\[CDATA\[|\]\]>$/g, "")) : "";
};

/** @returns {Array<{ title: string, link: string, source: string, publishedAt: string }>} */
export function parseRss(xml) {
  const items = [];
  for (const [, block] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const title = tag(block, "title");
    const link = tag(block, "link");
    const date = new Date(tag(block, "pubDate"));
    if (!title || !/^https?:\/\//.test(link) || Number.isNaN(date.getTime())) continue;
    items.push({ title, link, source: tag(block, "source") || "News", publishedAt: date.toISOString() });
  }
  return items;
}

/** Whole words (with simple endings), so "rob" never catches "Robinsons" or "die" "diet". */
const BLOCKED_WORDS = [
  "kill", "murder", "slay", "slain", "shot", "shoot", "stab", "dead", "death", "die", "body", "bodies", "corpse", "cadaver", "rape", "rapist",
  "sexual", "molest", "abuse", "rob", "robber", "robbery", "holdup", "hold-up", "theft", "thief", "thieves", "steal", "stole", "burglar", "carnap",
  "arrest", "nab", "drug", "shabu", "buy-bust", "suspect", "gunman", "gun", "firearm", "crime", "criminal", "violence", "violent", "assault",
  "kidnap", "hostage", "scam", "fraud", "terror", "bomb", "attack", "fight", "brawl", "riot", "accident", "crash", "collision", "injury", "injure",
  "wound", "tragedy", "tragic", "victim", "fatal", "casualty", "missing", "obituary", "patay", "pinatay", "bangkay", "binaril", "sinaksak",
  "ninakaw", "holdap", "nahuli", "droga", "nasawi", "sugatan",
];
/** Word starts that are safe to match as prefixes (long enough to be unambiguous). */
const BLOCKED_PREFIXES = ["murder", "robb", "shooting", "stabb", "injur", "casualt", "swindl", "burglar", "kidnap", "molest", "violen", "assault", "arrest", "suspect", "firearm", "terroris", "explosi"];

const BLOCKED = new RegExp(
  `\\b(?:(?:${BLOCKED_WORDS.join("|")})(?:s|es|ed|d|ing|ning|ned|ted|ping|ped)?\\b|(?:${BLOCKED_PREFIXES.join("|")}))`,
  "i",
);

const TOPICS = [
  { category: "traffic", topic: "traffic", words: ["road", "traffic", "closure", "closed", "detour", "reroute", "toll", "cavitex", "calax", "bridge", "construction", "roadwork", "power interruption", "water interruption"] },
  { category: "events", topic: "announcement", words: ["festival", "fiesta", "event", "concert", "market", "christmas", "parade", "celebration", "anniversary", "opening", "fair", "exhibit", "tourism", "heritage", "contest", "run", "lights"] },
  { category: "barangay", topic: "announcement", words: ["program", "scholarship", "school", "students", "livelihood", "jobs", "job fair", "barangay", "mayor", "health", "vaccination", "business", "store", "opens", "launch", "donation", "feeding", "clean-up", "cleanup", "mall", "restaurant", "cafe", "park"] },
];

const hasWord = (text, word) => new RegExp(`\\b${word.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}`, "i").test(text);

/** Removes the " - Publisher" Google News adds to the end of titles. */
export function cleanTitle(title, source) {
  const suffix = ` - ${source}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length).trim() : title;
}

/** @returns {{ ok: true, category: string, topic: string } | { ok: false, reason: "not-kawit" | "blocked" | "no-topic" }} */
export function classifyItem(item) {
  const title = cleanTitle(item.title, item.source);
  if (!/\bkawit\b/i.test(title)) return { ok: false, reason: "not-kawit" };
  if (BLOCKED.test(title)) return { ok: false, reason: "blocked" };
  const match = TOPICS.find((t) => t.words.some((w) => hasWord(title, w)));
  return match ? { ok: true, category: match.category, topic: match.topic } : { ok: false, reason: "no-topic" };
}

const normalizeTitle = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Accepted, recent, de-duplicated items, newest first.
 * @returns {Array<{ id: string, title: string, link: string, source: string, publishedAt: string, category: string, topic: string }>}
 */
export function selectItems(items, now, maxAgeDays = MAX_AGE_DAYS) {
  const oldest = now.getTime() - maxAgeDays * 86_400_000;
  const seen = new Set();
  return items
    .filter((item) => new Date(item.publishedAt).getTime() >= oldest)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .flatMap((item) => {
      const verdict = classifyItem(item);
      if (!verdict.ok) return [];
      const title = cleanTitle(item.title, item.source);
      const key = normalizeTitle(title);
      if (seen.has(key)) return [];
      seen.add(key);
      const id = createHash("sha1").update(key).digest("hex").slice(0, 10);
      return [{ id, title, link: item.link, source: item.source, publishedAt: item.publishedAt, category: verdict.category, topic: verdict.topic }];
    });
}
