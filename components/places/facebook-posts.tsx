"use client";

import { ExternalLink, Newspaper } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function isFacebookUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host === "facebook.com" || host.endsWith(".facebook.com");
  } catch {
    return false;
  }
}

/**
 * Facebook's official Page Plugin, loaded only after a tap. It shows the page's
 * latest public posts live from Facebook, so nothing is scraped or stored, and
 * Facebook only gets contact with the visitor if they choose to load it.
 */
export function FacebookPosts({ pageUrl, pageName }: { pageUrl: string; pageName: string }) {
  const [loaded, setLoaded] = useState(false);
  const src = `https://www.facebook.com/plugins/page.php?${new URLSearchParams({
    href: pageUrl,
    tabs: "timeline",
    width: "500",
    height: "560",
    small_header: "true",
    adapt_container_width: "true",
    hide_cover: "true",
    show_facepile: "false",
  })}`;

  return (
    <section aria-label="Latest posts from Facebook" className="space-y-2 rounded-lg border p-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        <Newspaper className="size-4 text-primary" aria-hidden /> Latest posts
      </h3>
      {loaded ? (
        <iframe
          title={`Latest Facebook posts from ${pageName}`}
          src={src}
          loading="lazy"
          className="h-[560px] w-full rounded-md border-0 bg-muted"
          allow="encrypted-media"
        />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Shows what this page posted most recently, loaded directly from Facebook. Facebook may set cookies when it loads.
          </p>
          <Button variant="outline" className="h-10" onClick={() => setLoaded(true)}>
            Show latest posts
          </Button>
        </>
      )}
      <a
        href={pageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
      >
        Open on Facebook <ExternalLink className="size-3" aria-hidden />
      </a>
    </section>
  );
}
