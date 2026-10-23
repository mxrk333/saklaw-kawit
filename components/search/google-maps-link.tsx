import { ExternalLink } from "lucide-react";
import { interpretQuery } from "@/lib/search/query";

/**
 * Our listings only cover what open data and the team have added, so offer a way
 * to keep looking: the same search on Google Maps, in a new tab (a link, not a copy of its data).
 */
export function GoogleMapsLink({ query }: { query: string }) {
  const keywords = interpretQuery(query).tokens.join(" ") || "shops and services";
  const href = `https://www.google.com/maps/search/${encodeURIComponent(`${keywords} Kawit Cavite`)}`;
  return (
    <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
      Can&apos;t find a shop? Not every small store is listed here yet.{" "}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
      >
        Search &ldquo;{keywords}&rdquo; on Google Maps <ExternalLink className="size-3" aria-hidden />
      </a>
    </p>
  );
}
