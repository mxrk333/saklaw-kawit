import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SiteHeader } from "@/components/layout/site-header";
import { ListingPage } from "@/components/places/listing-page";
import { listingsRepository } from "@/lib/data/repository";
import { formatDate } from "@/lib/utils/format";
import { isCurrentAnnouncement } from "@/lib/utils/verification";

export async function generateMetadata(props: PageProps<"/announcements/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const announcement = await listingsRepository.findAnnouncement(id);
  return { title: announcement?.title ?? "Announcement not found" };
}

export default async function AnnouncementDetailPage(props: PageProps<"/announcements/[id]">) {
  await connection();
  const { id } = await props.params;
  const announcement = await listingsRepository.findAnnouncement(id);
  if (!announcement) notFound();

  const now = new Date();
  const expired = !isCurrentAnnouncement(announcement, now);

  return (
    <>
      <SiteHeader />
      <div className="flex-1">
        {expired && announcement.expiresAt && (
          <p role="status" className="mx-auto mt-4 max-w-6xl rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            This announcement expired on {formatDate(announcement.expiresAt)} and is no longer current.
          </p>
        )}
        <ListingPage listing={announcement} initialNow={now.toISOString()} />
      </div>
    </>
  );
}
