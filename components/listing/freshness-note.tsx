import { Clock, Info } from "lucide-react";
import { formatDate, formatRelative } from "@/lib/utils/format";
import type { Listing } from "@/types";

function describe(listing: Listing, now: Date): string {
  switch (listing.kind) {
    case "business":
      return listing.lastVerifiedAt
        ? `Checked by the SAKLAW team ${formatRelative(listing.lastVerifiedAt, now)}`
        : "Not checked by the SAKLAW team yet. Call ahead to be sure.";
    case "announcement":
      return listing.expiresAt
        ? `Published ${formatRelative(listing.publishedAt, now)} · valid until ${formatDate(listing.expiresAt)}`
        : `Published ${formatRelative(listing.publishedAt, now)}`;
    case "event":
      return `Updated ${formatRelative(listing.updatedAt, now)}`;
  }
}

export function FreshnessNote({ listing, now }: { listing: Listing; now: Date }) {
  const unchecked = listing.kind === "business" && !listing.lastVerifiedAt;
  const Icon = unchecked ? Info : Clock;
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="size-3 shrink-0" aria-hidden />
      {describe(listing, now)}
    </p>
  );
}
