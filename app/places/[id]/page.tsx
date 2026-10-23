import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SiteHeader } from "@/components/layout/site-header";
import { ListingPage } from "@/components/places/listing-page";
import { listingsRepository } from "@/lib/data/repository";

export async function generateMetadata(props: PageProps<"/places/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const business = await listingsRepository.findBusiness(id);
  return { title: business?.title ?? "Place not found" };
}

export default async function PlaceDetailPage(props: PageProps<"/places/[id]">) {
  await connection();
  const { id } = await props.params;
  const business = await listingsRepository.findBusiness(id);
  if (!business) notFound();

  return (
    <>
      <SiteHeader />
      <div className="flex-1">
        <ListingPage listing={business} initialNow={new Date().toISOString()} />
      </div>
    </>
  );
}
