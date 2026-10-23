import type { ReactNode } from "react";

/** Mobile sheet anchored to the bottom of its (relatively positioned) parent. */
export function BottomSheet({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section
      aria-label={label}
      className="absolute inset-x-0 bottom-0 z-10 max-h-[58%] overflow-y-auto rounded-t-2xl border-t bg-card px-4 pt-2 pb-6 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]"
    >
      <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" aria-hidden />
      {children}
    </section>
  );
}
