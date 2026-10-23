import type { Metadata } from "next";
import { connection } from "next/server";
import { SourceLinks } from "@/components/announcements/source-links";
import { PageShell } from "@/components/layout/page-shell";
import { ListingLinkCard } from "@/components/search/result-card";
import { listingsRepository } from "@/lib/data/repository";
import { isCurrentAnnouncement } from "@/lib/utils/verification";

export const metadata: Metadata = { title: "Community updates" };

export default async function AnnouncementsPage() {
  await connection();
  const now = new Date();
  const current = (await listingsRepository.loadAll())
    .flatMap((l) => (l.kind === "announcement" && isCurrentAnnouncement(l, now) ? [l] : []))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <PageShell
      title="Community updates"
      intro="Current announcements, ordinances, school notices, and road advisories. Expired items are hidden."
    >
      <SourceLinks />
      {current.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No current announcements have been added yet. Check the local sources above for the latest posts.
        </p>
      )}
      <ul className="space-y-2">
        {current.map((announcement) => (
          <ListingLinkCard key={announcement.id} listing={announcement} href={`/announcements/${announcement.id}`} now={now} />
        ))}
      </ul>
    </PageShell>
  );
}
