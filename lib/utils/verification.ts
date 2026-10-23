import type { Announcement, Listing, SourceInfo, VerificationStatus } from "@/types";

/**
 * An "official" label is only honoured when the source carries verification
 * metadata. Anything else is downgraded so we never over-claim.
 */
export function resolveVerification(status: VerificationStatus, source: SourceInfo): VerificationStatus {
  if (status !== "official") return status;
  return source.verifiedBy && source.verifiedAt ? "official" : "unverified";
}

export function isOfficial(listing: Listing): boolean {
  return resolveVerification(listing.verification, listing.source) === "official";
}

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  official: "Official source",
  verified: "Verified",
  community: "Community submitted",
  unverified: "Unverified",
};

/** Announcements past their expiry must never be presented as current. */
export function isCurrentAnnouncement(announcement: Announcement, now: Date): boolean {
  if (!announcement.expiresAt) return true;
  return new Date(announcement.expiresAt).getTime() > now.getTime();
}

export function isCurrentListing(listing: Listing, now: Date): boolean {
  if (listing.kind === "announcement") return isCurrentAnnouncement(listing, now);
  if (listing.kind === "event") return new Date(listing.endsAt ?? listing.startsAt).getTime() > now.getTime();
  return true;
}
