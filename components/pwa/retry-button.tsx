"use client";

import { Button } from "@/components/ui/button";

/** A full reload, so the browser actually re-checks the connection. */
export function RetryButton() {
  return (
    <Button className="mt-2 h-10 px-4" onClick={() => window.location.reload()}>
      Try again
    </Button>
  );
}
