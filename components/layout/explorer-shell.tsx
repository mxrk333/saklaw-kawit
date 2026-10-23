"use client";

import { List, Map as MapIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPanel } from "@/components/map/map-panel";
import { ListingDetails } from "@/components/places/listing-details";
import { CategoryBar } from "@/components/search/category-bar";
import { FilterBar } from "@/components/search/filter-bar";
import { ResultList } from "@/components/search/result-list";
import { SearchBar } from "@/components/search/search-bar";
import { useDirections } from "@/hooks/use-directions";
import { useListings } from "@/hooks/use-listings";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useNow } from "@/hooks/use-now";
import { searchListings } from "@/lib/search/engine";
import { getSuggestions } from "@/lib/search/suggestions";
import { cn } from "@/lib/utils";
import type { CategoryId, MapLocation, SortMode } from "@/types";
import { BottomSheet } from "./bottom-sheet";

interface ExplorerShellProps {
  initialNow: string;
  initialQuery: string;
  initialCategory: CategoryId;
  initialSelected: string | null;
}

const MOBILE_SHEET_PADDING = 260;

export function ExplorerShell({ initialNow, initialQuery, initialCategory, initialSelected }: ExplorerShellProps) {
  const now = useNow(initialNow);
  const { listings, loading, error, reload } = useListings();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryId>(initialCategory);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>("relevance");
  const [requestedKey, setRequestedKey] = useState<string | null>(initialSelected);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");

  const results = useMemo(
    () => searchListings(listings, { query, category, openNowOnly, sort }, now),
    [listings, query, category, openNowOnly, sort, now],
  );
  const mapLocations = useMemo(
    () => results.flatMap((r) => (r.location ? [r.location] : [])) satisfies MapLocation[],
    [results],
  );

  // A selection only counts while it is still part of the current results.
  const selected = results.find((r) => r.key === requestedKey) ?? null;
  const selectedKey = selected?.key ?? null;
  const destination = selected?.location?.coordinates ?? null;
  const directions = useDirections(destination);

  const select = useCallback(
    (key: string | null) => {
      setRequestedKey(key);
      setDirectionsOpen(false);
      if (key && !isDesktop) setMobileView("map");
    },
    [isDesktop],
  );

  const requestDirections = useCallback(
    (key: string) => {
      setRequestedKey(key);
      setDirectionsOpen(true);
    },
    [],
  );

  const clearAll = () => {
    setQuery("");
    setCategory("all");
    setOpenNowOnly(false);
  };

  // Keep the URL shareable without triggering navigation.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "all") params.set("category", category);
    if (selectedKey) params.set("selected", selectedKey);
    const search = params.toString();
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
  }, [query, category, selectedKey]);

  const suggestions = useMemo(() => getSuggestions(query, listings), [query, listings]);
  const showDetailsInPanel = Boolean(selected) && isDesktop;
  const showSheet = Boolean(selected) && !isDesktop && mobileView === "map";

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

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <aside className="flex min-h-0 flex-col border-b bg-background lg:w-[420px] lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="space-y-2.5 px-4 pt-3 pb-2">
          <SearchBar value={query} suggestions={suggestions} onChange={setQuery} />
          <CategoryBar value={category} onChange={setCategory} />
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <div role="group" aria-label="Map or list" className="inline-flex rounded-lg border bg-card p-0.5 text-xs font-medium">
              {(
                [
                  { id: "map", label: "Map", Icon: MapIcon },
                  { id: "list", label: `List (${results.length})`, Icon: List },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={mobileView === id}
                  onClick={() => setMobileView(id)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-3",
                    mobileView === id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>
          {!showDetailsInPanel && (
            <FilterBar
              openNowOnly={openNowOnly}
              sort={sort}
              count={results.length}
              onOpenNowChange={setOpenNowOnly}
              onSortChange={setSort}
            />
          )}
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto px-4 pb-6 lg:block",
            mobileView === "list" ? "block max-h-[calc(100dvh-14rem)]" : "hidden",
          )}
        >
          {showDetailsInPanel ? (
            details
          ) : (
            <ResultList
              results={results}
              loading={loading}
              error={error}
              selectedKey={selectedKey}
              now={now}
              onSelect={select}
              onClearFilters={clearAll}
              onRetry={reload}
            />
          )}
        </div>
      </aside>

      <main className={cn("relative min-h-0 flex-1 lg:block", mobileView === "map" ? "block" : "hidden")}>
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
          bottomPadding={showSheet ? MOBILE_SHEET_PADDING : 0}
          recenterTarget={destination ?? directions.origin?.coordinates ?? null}
        />
        {showSheet && <BottomSheet label="Selected place">{details}</BottomSheet>}
      </main>
    </div>
  );
}
