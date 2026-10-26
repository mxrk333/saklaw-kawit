import type { Announcement, CategoryId } from "@/types";
import raw from "./news.json";
import { MAX_AGE_DAYS } from "../scripts/news-lib.mjs";

/** Shape of data/news.json, written by scripts/fetch-news.mjs and reviewed through a pull request. */
interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  category: CategoryId;
  topic: Announcement["topic"];
}

const { fetchedAt, items } = raw as { fetchedAt: string; items: NewsItem[] };

const DAY_MS = 86_400_000;

/** Headlines about Kawit from news sites. Only the headline and a link are kept; they are never marked verified. */
export const NEWS_ANNOUNCEMENTS: readonly Announcement[] = items.map((item) => ({
  kind: "announcement",
  id: `news-${item.id}`,
  title: item.title,
  description: `Headline from ${item.source}. SAKLAW has not verified this story. Open the original article for the full details.`,
  category: item.category,
  barangay: "Kawit",
  tags: ["news", item.source.toLowerCase()],
  verification: "unverified",
  source: { name: `${item.source} (via Google News)`, url: item.link },
  isDemo: false,
  updatedAt: fetchedAt,
  publishedAt: item.publishedAt,
  expiresAt: new Date(new Date(item.publishedAt).getTime() + MAX_AGE_DAYS * DAY_MS).toISOString(),
  topic: item.topic,
}));
