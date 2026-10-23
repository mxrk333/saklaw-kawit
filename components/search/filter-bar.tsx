import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortMode } from "@/types";

interface FilterBarProps {
  openNowOnly: boolean;
  sort: SortMode;
  count: number;
  onOpenNowChange: (value: boolean) => void;
  onSortChange: (value: SortMode) => void;
}

export function FilterBar({ openNowOnly, sort, count, onOpenNowChange, onSortChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {count} {count === 1 ? "result" : "results"}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-pressed={openNowOnly}
          onClick={() => onOpenNowChange(!openNowOnly)}
          title="Only places with known opening hours (confirmed, or from OpenStreetMap) that are open right now"
          className={cn(
            "inline-flex h-9 items-center gap-1 rounded-full lg:h-7 border px-2.5 text-xs font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            openNowOnly ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted",
          )}
        >
          <Clock className="size-3" aria-hidden />
          Open now
        </button>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          Sort
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortMode)}
            className="h-9 rounded-md border bg-card px-1.5 text-xs text-foreground lg:h-7"
          >
            <option value="relevance">Relevance</option>
            <option value="recent">Recently updated</option>
          </select>
        </label>
      </div>
    </div>
  );
}
