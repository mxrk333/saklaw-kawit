import { ANNOUNCEMENTS } from "@/data/announcements";
import { BUSINESSES } from "@/data/businesses";
import { EVENTS } from "@/data/events";
import { reportSchema, type ReportInput, type ReportRecord } from "@/lib/contributions/schemas";
import type { Announcement, Business, CommunityEvent, Listing } from "@/types";

/**
 * Data access boundary. The in-memory implementation below serves demo data;
 * a Firebase (Firestore) implementation can replace it without touching the UI.
 * Reports and moderation: submissions are validated, stored as `pending`, and
 * never alter a listing until a moderator approves them.
 */
export interface ListingsRepository {
  loadAll(): Promise<readonly Listing[]>;
  findBusiness(id: string): Promise<Business | null>;
  findAnnouncement(id: string): Promise<Announcement | null>;
  findEvent(id: string): Promise<CommunityEvent | null>;
  submitReport(input: ReportInput): Promise<ReportRecord>;
}

const reports: ReportRecord[] = [];

export const listingsRepository: ListingsRepository = {
  async loadAll() {
    return [...BUSINESSES, ...ANNOUNCEMENTS, ...EVENTS];
  },
  async findBusiness(id) {
    return BUSINESSES.find((b) => b.id === id) ?? null;
  },
  async findAnnouncement(id) {
    return ANNOUNCEMENTS.find((a) => a.id === id) ?? null;
  },
  async findEvent(id) {
    return EVENTS.find((e) => e.id === id) ?? null;
  },
  async submitReport(input) {
    const parsed = reportSchema.parse(input);
    const record: ReportRecord = {
      ...parsed,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    reports.push(record);
    return record;
  },
};
