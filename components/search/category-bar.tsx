import { CategoryIcon } from "@/components/listing/category-icon";
import { CATEGORIES } from "@/data/categories";
import { cn } from "@/lib/utils";
import type { CategoryId } from "@/types";

interface CategoryBarProps {
  value: CategoryId;
  /** Number of listings per category; empty ones are dimmed but still open an explanation. */
  counts?: Partial<Record<CategoryId, number>>;
  onChange: (category: CategoryId) => void;
}

export function CategoryBar({ value, counts, onChange }: CategoryBarProps) {
  return (
    <div
      role="group"
      aria-label="Categories"
      className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {CATEGORIES.map((category) => {
        const active = category.id === value;
        const count = counts?.[category.id];
        const empty = count === 0;
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(category.id)}
            className={cn(
              "inline-flex h-9 shrink-0 lg:h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-muted",
              empty && !active && "text-muted-foreground",
            )}
          >
            <CategoryIcon category={category.id} className="size-3.5" />
            {category.label}
            {count !== undefined && category.id !== "all" && (
              <span className={cn("text-[0.7rem] tabular-nums", active ? "opacity-80" : "text-muted-foreground")}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
