import { CategoryIcon } from "@/components/listing/category-icon";
import { CATEGORIES } from "@/data/categories";
import { cn } from "@/lib/utils";
import type { CategoryId } from "@/types";

interface CategoryBarProps {
  value: CategoryId;
  onChange: (category: CategoryId) => void;
}

export function CategoryBar({ value, onChange }: CategoryBarProps) {
  return (
    <div
      role="group"
      aria-label="Categories"
      className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {CATEGORIES.map((category) => {
        const active = category.id === value;
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(category.id)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-muted",
            )}
          >
            <CategoryIcon category={category.id} className="size-3.5" />
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
