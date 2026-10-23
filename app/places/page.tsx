import type { Metadata } from "next";
import { connection } from "next/server";
import { PageShell } from "@/components/layout/page-shell";
import { ListingLinkCard } from "@/components/search/result-card";
import { listingsRepository } from "@/lib/data/repository";
import { isOpenNow } from "@/lib/utils/hours";

export const metadata: Metadata = { title: "Places & services" };

export default async function PlacesPage() {
  await connection();
  const now = new Date();
  const businesses = (await listingsRepository.loadAll()).filter((l) => l.kind === "business");

  return (
    <PageShell title="Places & services" intro="Businesses, clinics, offices, and schools around Kawit.">
      <ul className="space-y-2">
        {businesses.map((business) => (
          <ListingLinkCard
            key={business.id}
            listing={business}
            href={`/places/${business.id}`}
            openNow={business.kind === "business" ? isOpenNow(business, now) : undefined}
            now={now}
          />
        ))}
      </ul>
    </PageShell>
  );
}
