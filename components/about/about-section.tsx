import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AboutSectionProps {
  id: string;
  title: string;
  tone?: "default" | "notice";
  children: ReactNode;
}

/** One titled card on the About page. */
export function AboutSection({ id, title, tone = "default", children }: AboutSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn(
        "scroll-mt-16 space-y-3 rounded-2xl border p-5",
        tone === "notice" ? "border-amber-300 bg-amber-50 text-amber-950" : "bg-card",
      )}
    >
      <h2 id={`${id}-heading`} className="text-lg font-semibold tracking-tight">
        {title}
      </h2>
      <div className={cn("space-y-3 text-[15px] leading-7", tone === "default" && "text-foreground/85")}>{children}</div>
    </section>
  );
}
