import { DEFAULT_SUGGESTIONS } from "@/lib/search/suggestions";

/** Starter searches shown before anything is typed, so people learn what to ask. */
export function KeywordChips({ onPick }: { onPick: (keyword: string) => void }) {
  return (
    <section aria-label="Try searching for">
      <h2 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Try searching for</h2>
      <div className="flex flex-wrap gap-1.5">
        {DEFAULT_SUGGESTIONS.map((keyword) => (
          <button
            key={keyword}
            type="button"
            onClick={() => onPick(keyword)}
            className="h-9 rounded-full border bg-card px-3 text-xs font-medium hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none lg:h-8"
          >
            {keyword}
          </button>
        ))}
      </div>
    </section>
  );
}
