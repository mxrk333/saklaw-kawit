import Link from "next/link";
import { CATEGORY_LABELS } from "@/data/categories";
import { CategoryIcon } from "@/components/listing/category-icon";
import { FreshnessNote } from "@/components/listing/freshness-note";
import { LiveBadge } from "@/components/listing/live-badge";
import { OpenStatus } from "@/components/listing/open-status";
import { DemoBadge, VerificationBadge } from "@/components/listing/verification-badge";
import { cn } from "@/lib/utils";
import type { Listing, SearchResult } from "@/types";

const cardClass =
  "flex w-full gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/** Shared body for every listing card (explorer results and the list pages). */
export function ResultCardContent({
  listing,
  openNow,
  now,
  matchedOn,
}: {
  listing: Listing;
  openNow?: boolean;
  now: Date;
  /** Words that matched the search; shown so results are explainable. */
  matchedOn?: readonly string[];
}) {
  return (
    <>
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <CategoryIcon category={listing.category} className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="block text-sm font-semibold leading-snug">{listing.title}</span>
        <span className="block text-xs text-muted-foreground">
          {CATEGORY_LABELS[listing.category]} · {listing.barangay}
        </span>
        <span className="line-clamp-2 block text-sm text-muted-foreground">{listing.description}</span>
        <span className="flex flex-wrap items-center gap-1.5">
          <VerificationBadge listing={listing} />
          {listing.kind === "business" && <OpenStatus business={listing} openNow={openNow} now={now} />}
          {listing.kind === "event" && <LiveBadge event={listing} now={now} />}
          {listing.isDemo && <DemoBadge />}
        </span>
        {listing.kind === "business" && listing.phone && (
          <span className="block text-xs text-foreground">Phone: {listing.phone}</span>
        )}
        {matchedOn && matchedOn.length > 0 && (
          <span className="block text-xs text-primary">Matched: {matchedOn.join(", ")}</span>
        )}
        <FreshnessNote listing={listing} now={now} />
      </span>
    </>
  );
}

interface ResultCardProps {
  result: SearchResult;
  selected: boolean;
  now: Date;
  onSelect: (key: string) => void;
}

export function ResultCard({ result, selected, now, onSelect }: ResultCardProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(result.key)}
        aria-pressed={selected}
        className={cn(cardClass, selected && "border-primary bg-primary/5")}
      >
        <ResultCardContent listing={result.listing} openNow={result.openNow} now={now} matchedOn={result.matchedOn} />
      </button>
    </li>
  );
}

export function ListingLinkCard({ listing, href, openNow, now }: { listing: Listing; href: string; openNow?: boolean; now: Date }) {
  return (
    <li id={listing.id}>
      <Link href={href} className={cardClass}>
        <ResultCardContent listing={listing} openNow={openNow} now={now} />
      </Link>
    </li>
  );
}
