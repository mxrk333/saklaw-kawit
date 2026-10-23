import { SearchX, TriangleAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ContentType, SearchResult } from "@/types";
import { ResultCard } from "./result-card";

const SECTIONS: ReadonlyArray<{ type: ContentType; label: string }> = [
  { type: "business", label: "Places & services" },
  { type: "announcement", label: "Community updates" },
  { type: "event", label: "Events" },
];

interface ResultListProps {
  results: readonly SearchResult[];
  loading: boolean;
  error: string | null;
  selectedKey: string | null;
  now: Date;
  onSelect: (key: string) => void;
  onClearFilters: () => void;
  onRetry: () => void;
}

export function ResultList({ results, loading, error, selectedKey, now, onSelect, onClearFilters, onRetry }: ResultListProps) {
  if (loading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading results">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center" role="alert">
        <TriangleAlert className="mx-auto size-6 text-destructive" aria-hidden />
        <p className="mt-2 text-sm font-medium">We couldn&apos;t load listings</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <SearchX className="mx-auto size-7 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-sm font-medium">Nothing matches that search</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Try a broader word like &ldquo;clinic&rdquo; or &ldquo;pharmacy&rdquo;, switch category, or turn off Open now.
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onClearFilters}>
          Clear search and filters
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {SECTIONS.map(({ type, label }) => {
        const group = results.filter((r) => r.type === type);
        if (group.length === 0) return null;
        return (
          <section key={type} aria-label={label}>
            <h2 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {label} · {group.length}
            </h2>
            <ul className="space-y-2">
              {group.map((result) => (
                <ResultCard
                  key={result.key}
                  result={result}
                  selected={result.key === selectedKey}
                  now={now}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
