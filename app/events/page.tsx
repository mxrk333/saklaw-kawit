import type { Metadata } from "next";
import { connection } from "next/server";
import { PageShell } from "@/components/layout/page-shell";
import { ListingLinkCard } from "@/components/search/result-card";
import { listingsRepository } from "@/lib/data/repository";
import { isCurrentListing } from "@/lib/utils/verification";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  await connection();
  const now = new Date();
  const upcoming = (await listingsRepository.loadAll())
    .flatMap((l) => (l.kind === "event" && isCurrentListing(l, now) ? [l] : []))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <PageShell title="Events" intro="Upcoming community activities in Kawit. Past events are hidden.">
      {upcoming.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No upcoming events have been added yet.
        </p>
      )}
      <ul className="space-y-2">
        {upcoming.map((event) => (
          <ListingLinkCard key={event.id} listing={event} href={`/?selected=event:${event.id}`} now={now} />
        ))}
      </ul>
    </PageShell>
  );
}
