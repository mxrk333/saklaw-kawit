"use client";

import { useMemo, useState } from "react";
import { MapPanel } from "@/components/map/map-panel";
import { useDirections } from "@/hooks/use-directions";
import { useNow } from "@/hooks/use-now";
import { toMapLocation } from "@/lib/search/engine";
import { isOpenNow } from "@/lib/utils/hours";
import type { Listing } from "@/types";
import { ListingDetails } from "./listing-details";

/** Full-page view of one listing: details beside a map with directions. */
export function ListingPage({ listing, initialNow }: { listing: Listing; initialNow: string }) {
  const now = useNow(initialNow);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const location = useMemo(() => toMapLocation(listing), [listing]);
  const directions = useDirections(listing.coordinates ?? null);
  const locations = useMemo(() => (location ? [location] : []), [location]);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <ListingDetails
        listing={listing}
        now={now}
        openNow={listing.kind === "business" ? isOpenNow(listing, now) : undefined}
        directions={directions}
        directionsOpen={directionsOpen}
        onDirectionsOpenChange={setDirectionsOpen}
      />
      {location && (
        <div className="h-80 overflow-hidden rounded-2xl border lg:sticky lg:top-4 lg:h-[32rem]">
          <MapPanel
            locations={locations}
            selectedKey={location.key}
            onSelect={() => undefined}
            onRequestDirections={() => setDirectionsOpen(true)}
            route={directions.route}
            origin={directions.origin}
            pickingOrigin={directions.pickingOrigin}
            onPickOrigin={directions.pickOrigin}
            showPopup={false}
            bottomPadding={0}
            topPadding={0}
            recenterTarget={location.coordinates}
          />
        </div>
      )}
    </div>
  );
}
