import type { Announcement } from "@/types";

/**
 * Empty on purpose. Announcements must come from a real, attributed post
 * (with its own source URL and, for "official", verification details).
 * Barangay pages are linked from each barangay listing and from data/source-links.ts.
 */
export const ANNOUNCEMENTS: readonly Announcement[] = [];
