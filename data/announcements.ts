import type { Announcement } from "@/types";
import { NEWS_ANNOUNCEMENTS } from "./news";

/**
 * Nothing is written by hand here. Announcements must come from a real, attributed post
 * (with its own source URL and, for "official", verification details). Today that means
 * reviewed news headlines (data/news.ts). Barangay pages are linked from each barangay
 * listing and from data/source-links.ts.
 */
export const ANNOUNCEMENTS: readonly Announcement[] = [...NEWS_ANNOUNCEMENTS];
