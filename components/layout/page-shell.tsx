import type { ReactNode } from "react";
import { BrandBackdrop } from "./brand-backdrop";
import { SiteHeader } from "./site-header";

export function PageShell({ title, intro, children }: { title?: string; intro?: string; children: ReactNode }) {
  return (
    <div className="relative isolate flex flex-1 flex-col">
      <BrandBackdrop />
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4 pb-12">
        {title && (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {intro && <p className="mt-1 text-sm text-muted-foreground">{intro}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
