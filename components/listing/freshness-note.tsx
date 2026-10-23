import { Clock } from "lucide-react";
import { formatDate, formatRelative } from "@/lib/utils/format";
import type { Listing } from "@/types";

function describe(listing: Listing, now: Date): string {
  switch (listing.kind) {
    case "business":
      return listing.lastVerifiedAt
        ? `Last verified ${formatRelative(listing.lastVerifiedAt, now)}`
        : `Not verified yet · updated ${formatRelative(listing.updatedAt, now)}`;
    case "announcement":
      return listing.expiresAt
        ? `Published ${formatRelative(listing.publishedAt, now)} · valid until ${formatDate(listing.expiresAt)}`
        : `Published ${formatRelative(listing.publishedAt, now)}`;
    case "event":
      return `Updated ${formatRelative(listing.updatedAt, now)}`;
  }
}

export function FreshnessNote({ listing, now }: { listing: Listing; now: Date }) {
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="size-3" aria-hidden />
      {describe(listing, now)}
    </p>
  );
}
