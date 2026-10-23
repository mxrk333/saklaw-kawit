"use client";

import { useCallback, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { MapPanel } from "@/components/map/map-panel";
import { ListingDetails } from "@/components/places/listing-details";
import { CategoryBar } from "@/components/search/category-bar";
import { FilterBar } from "@/components/search/filter-bar";
import { GoogleMapsLink } from "@/components/search/google-maps-link";
import { KeywordChips } from "@/components/search/keyword-chips";
import { QueryNote } from "@/components/search/query-note";
import { ResultList } from "@/components/search/result-list";
import { SearchBar } from "@/components/search/search-bar";
import { useDirections } from "@/hooks/use-directions";
import { useListings } from "@/hooks/use-listings";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useNow } from "@/hooks/use-now";
import { countByCategory, searchListings } from "@/lib/search/engine";
import { getSuggestions } from "@/lib/search/suggestions";
import type { CategoryId, MapLocation, SortMode } from "@/types";
import { BottomSheet, SHEET_PEEK_PX, type SheetSnap } from "./bottom-sheet";
import { useUrlSync } from "./use-url-sync";

interface ExplorerShellProps {
  initialNow: string;
  initialQuery: string;
  initialCategory: CategoryId;
  initialSelected: string | null;
}

/** Height of the floating search + category chips on phones. */
const MOBILE_TOP_INSET_PX = 124;

const subscribeToResize = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};
const viewportHeight = () => window.innerHeight;

export function ExplorerShell({ initialNow, initialQuery, initialCategory, initialSelected }: ExplorerShellProps) {
  const now = useNow(initialNow);
  const { listings, loading, error, reload } = useListings();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const innerHeight = useSyncExternalStore(subscribeToResize, viewportHeight, () => 0);

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryId>(initialCategory);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>("relevance");
  const [requestedKey, setRequestedKey] = useState<string | null>(initialSelected);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [snap, setSnap] = useState<SheetSnap>(initialSelected ? "half" : "peek");

  const results = useMemo(
    () => searchListings(listings, { query, category, openNowOnly, sort }, now),
    [listings, query, category, openNowOnly, sort, now],
  );
  const categoryCounts = useMemo(() => countByCategory(listings, now), [listings, now]);
  const mapLocations = useMemo(
    () => results.flatMap((r) => (r.location ? [r.location] : [])) satisfies MapLocation[],
    [results],
  );

  // A selection only counts while it is still part of the current results.
  const selected = results.find((r) => r.key === requestedKey) ?? null;
  const selectedKey = selected?.key ?? null;
  // Directions need an exact place; an area-only barangay has none.
  const destination = selected?.listing.coordinates ?? null;
  const focusPoint = selected?.location?.coordinates ?? null;
  const directions = useDirections(destination);

  useUrlSync(query, category, selectedKey);

  const select = useCallback((key: string | null) => {
    setRequestedKey(key);
    setDirectionsOpen(false);
    if (key) setSnap("half");
  }, []);

  const requestDirections = useCallback((key: string) => {
    setRequestedKey(key);
    setDirectionsOpen(true);
    setSnap("half");
  }, []);

  const clearAll = () => {
    setQuery("");
    setCategory("all");
    setOpenNowOnly(false);
  };

  const suggestions = useMemo(() => getSuggestions(query, listings), [query, listings]);

  const searchControls = (
    <>
      <SearchBar value={query} suggestions={suggestions} onChange={setQuery} />
      <CategoryBar value={category} counts={loading ? undefined : categoryCounts} onChange={setCategory} />
    </>
  );

  const details = selected && (
    <ListingDetails
      listing={selected.listing}
      now={now}
      openNow={selected.openNow}
      directions={directions}
      directionsOpen={directionsOpen}
      onDirectionsOpenChange={setDirectionsOpen}
      onBack={() => select(null)}
    />
  );

  const filters = (
    <FilterBar openNowOnly={openNowOnly} sort={sort} count={results.length} onOpenNowChange={setOpenNowOnly} onSortChange={setSort} />
  );

  const resultList = (
    <div className="space-y-3">
      {query.trim() ? <QueryNote query={query} /> : <KeywordChips onPick={setQuery} />}
      <ResultList
      results={results}
      loading={loading}
      error={error}
      selectedKey={selectedKey}
      category={category}
      hasQuery={query.trim().length > 0}
      now={now}
      onSelect={select}
      onClearFilters={clearAll}
      onRetry={reload}
      />
      {!loading && !error && <GoogleMapsLink query={query} />}
    </div>
  );

  const sheetPadding = snap === "half" ? Math.round(innerHeight * 0.4) : SHEET_PEEK_PX;
  const map: ReactNode = (
    <MapPanel
      locations={mapLocations}
      selectedKey={selectedKey}
      onSelect={select}
      onRequestDirections={requestDirections}
      route={directions.route}
      origin={directions.origin}
      pickingOrigin={directions.pickingOrigin}
      onPickOrigin={directions.pickOrigin}
      showPopup={isDesktop}
      topPadding={isDesktop ? 0 : MOBILE_TOP_INSET_PX}
      bottomPadding={isDesktop ? 0 : sheetPadding}
      recenterTarget={focusPoint ?? directions.origin?.coordinates ?? null}
      explainMissingLocations={results.length > 0}
    />
  );

  if (isDesktop) {
    return (
      <div className="flex min-h-0 flex-1">
        <aside className="flex min-h-0 w-[420px] shrink-0 flex-col border-r bg-background">
          <div className="space-y-2.5 px-4 pt-3 pb-2">
            {searchControls}
            {!selected && filters}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">{selected ? details : resultList}</div>
        </aside>
        <main className="relative min-h-0 flex-1">{map}</main>
      </div>
    );
  }

  return (
    <main className="relative min-h-0 flex-1 overflow-hidden">
      {map}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3">
        <div className="pointer-events-auto space-y-2">{searchControls}</div>
      </div>
      <BottomSheet
        label={selected ? "Selected place" : "Search results"}
        snap={snap}
        onSnapChange={setSnap}
        summary={
          selected ? (
            <span className="line-clamp-1">{selected.listing.title}</span>
          ) : (
            <span>
              {loading ? "Loading…" : `${results.length} ${results.length === 1 ? "place" : "places"} in Kawit`}
              <span className="font-normal text-muted-foreground"> · drag up for the list</span>
            </span>
          )
        }
      >
        {selected ? (
          details
        ) : (
          <div className="space-y-3 pt-1">
            {filters}
            {resultList}
          </div>
        )}
      </BottomSheet>
    </main>
  );
}
