"use client";

import { ArrowLeft, CalendarClock, ExternalLink, Globe, MapPin, Navigation, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DirectionsPanel } from "@/components/directions/directions-panel";
import { ReportDialog } from "@/components/contribute/report-dialog";
import { CategoryIcon } from "@/components/listing/category-icon";
import { FreshnessNote } from "@/components/listing/freshness-note";
import { OpenStatus } from "@/components/listing/open-status";
import { DemoBadge, VerificationBadge } from "@/components/listing/verification-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/data/categories";
import type { DirectionsState } from "@/hooks/use-directions";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { resolveVerification } from "@/lib/utils/verification";
import { cn } from "@/lib/utils";
import type { Business, Listing } from "@/types";
import { HoursTable } from "./hours-table";

export function listingHref(listing: Listing): string {
  if (listing.kind === "business") return `/places/${listing.id}`;
  if (listing.kind === "announcement") return `/announcements/${listing.id}`;
  return `/events#${listing.id}`;
}

interface ListingDetailsProps {
  listing: Listing;
  now: Date;
  openNow?: boolean;
  directions: DirectionsState;
  directionsOpen: boolean;
  onDirectionsOpenChange: (open: boolean) => void;
  /** Explorer mode: shows a back button and a link to the full listing. */
  onBack?: () => void;
}

export function ListingDetails({ listing, now, openNow, directions, directionsOpen, onDirectionsOpenChange, onBack }: ListingDetailsProps) {
  const coordinates = listing.coordinates;
  const key = `${listing.kind}:${listing.id}`;

  return (
    <article className="space-y-4">
      <header className="space-y-2">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
            <ArrowLeft /> Back to results
          </Button>
        )}
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <CategoryIcon category={listing.category} className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg leading-tight font-semibold">{listing.title}</h2>
            <p className="text-xs text-muted-foreground">
              {CATEGORY_LABELS[listing.category]} · {listing.barangay}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <VerificationBadge listing={listing} />
          {listing.kind === "business" && <OpenStatus business={listing} openNow={openNow} />}
          {listing.isDemo && <DemoBadge />}
        </div>
        <FreshnessNote listing={listing} now={now} />
      </header>

      {listing.isDemo && (
        <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          This is demonstration data. Names, hours, and contacts are samples, not real information.
        </p>
      )}

      <p className="text-sm leading-relaxed">{listing.description}</p>

      <div className="flex flex-wrap gap-2">
        {coordinates && (
          <Button onClick={() => onDirectionsOpenChange(!directionsOpen)} aria-expanded={directionsOpen}>
            <Navigation /> Get directions
          </Button>
        )}
        {listing.kind === "business" && listing.phone && (
          <a href={`tel:${listing.phone.replace(/[^+\d]/g, "")}`} className={buttonVariants({ variant: "outline" })}>
            <Phone /> Call
          </a>
        )}
        {listing.kind === "business" && listing.website && (
          <a href={listing.website} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
            <Globe /> {new URL(listing.website).hostname.includes("facebook.com") ? "Facebook page" : "Website"}
          </a>
        )}
        {onBack && (
          <Link href={listingHref(listing)} className={buttonVariants({ variant: "ghost" })}>
            View full listing
          </Link>
        )}
      </div>

      {!coordinates && (
        <p className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
          No verified map location yet, so there is no map pin or in-app directions for this listing.
        </p>
      )}

      {coordinates && directionsOpen && (
        <DirectionsPanel
          destination={coordinates}
          directions={directions}
          onClose={() => {
            directions.reset();
            onDirectionsOpenChange(false);
          }}
        />
      )}

      <KindDetails listing={listing} now={now} />
      <SourceBlock listing={listing} />

      <div className="flex justify-end border-t pt-2">
        <ReportDialog listingKey={key} listingTitle={listing.title} />
      </div>
    </article>
  );
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span>{children}</span>
    </p>
  );
}

function KindDetails({ listing, now }: { listing: Listing; now: Date }) {
  if (listing.kind === "business") return <BusinessDetails business={listing} now={now} />;
  if (listing.kind === "event") {
    return (
      <div className="space-y-2">
        <Row icon={<CalendarClock className="size-4" aria-hidden />}>
          {formatDateTime(listing.startsAt)}
          {listing.endsAt ? ` – ${formatDateTime(listing.endsAt)}` : ""}
        </Row>
        <Row icon={<MapPin className="size-4" aria-hidden />}>{listing.venue}</Row>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Row icon={<CalendarClock className="size-4" aria-hidden />}>
        Published {formatDate(listing.publishedAt)}
        {listing.expiresAt ? ` · valid until ${formatDate(listing.expiresAt)}` : " · no expiry date"}
      </Row>
      <Row icon={<MapPin className="size-4" aria-hidden />}>{listing.barangay}</Row>
    </div>
  );
}

function BusinessDetails({ business, now }: { business: Business; now: Date }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Row icon={<MapPin className="size-4" aria-hidden />}>{business.address}</Row>
        {business.phone && <Row icon={<Phone className="size-4" aria-hidden />}>{business.phone}</Row>}
      </div>
      {business.hours ? (
        <section aria-label="Operating hours" className="space-y-1.5">
          <h3 className="text-sm font-semibold">Operating hours</h3>
          <HoursTable hours={business.hours} now={now} verified={business.hoursVerified} />
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">Operating hours have not been listed.</p>
      )}
      <section aria-label="Community recommendations" className="space-y-1.5">
        <h3 className="text-sm font-semibold">Community recommendations</h3>
        {business.recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recommendations yet.</p>
        ) : (
          <ul className="space-y-2">
            {business.recommendations.map((r) => (
              <li key={r.id} className="rounded-lg bg-muted/50 p-2.5 text-sm">
                <p>{r.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.author} · {formatDate(r.createdAt)} · unverified community contribution
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SourceBlock({ listing }: { listing: Listing }) {
  const status = resolveVerification(listing.verification, listing.source);
  const { source } = listing;
  return (
    <section aria-label="Source" className={cn("rounded-lg border p-2.5 text-xs text-muted-foreground")}>
      <p>
        <span className="font-medium text-foreground">Source:</span> {source.name}
      </p>
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
        >
          View source <ExternalLink className="size-3" aria-hidden />
        </a>
      )}
      {(status === "official" || status === "verified") && source.verifiedBy && source.verifiedAt && (
        <p className="mt-0.5">
          Verified by {source.verifiedBy} on {formatDate(source.verifiedAt)}
        </p>
      )}
    </section>
  );
}
