"use client";

import { useEffect } from "react";

/** Registers the service worker (production only, so dev never serves stale caches). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    // If registration fails the app still works; it just has no offline fallback.
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
  }, []);
  return null;
}
