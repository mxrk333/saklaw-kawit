import { ExternalLink } from "lucide-react";
import { SOURCE_LINKS } from "@/data/source-links";

export function SourceLinks() {
  return (
    <section aria-labelledby="source-links-heading" className="rounded-xl border bg-card p-3">
      <h2 id="source-links-heading" className="text-sm font-semibold">
        Follow local sources
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Links to pages that post local updates. SAKLAW has not verified them yet.
      </p>
      <ul className="mt-2 space-y-1.5">
        {SOURCE_LINKS.map((link) => (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {link.name}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
