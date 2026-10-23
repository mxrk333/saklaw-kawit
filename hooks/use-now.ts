"use client";

import { useMemo, useSyncExternalStore } from "react";

const TICK_MS = 60_000;

function subscribe(onChange: () => void): () => void {
  const id = window.setInterval(onChange, TICK_MS);
  return () => window.clearInterval(id);
}

/** Snapshot is floored to the minute so it stays stable between ticks. */
function currentMinute(): number {
  return Math.floor(Date.now() / TICK_MS) * TICK_MS;
}

/**
 * Current time that is safe for SSR: the server render and hydration use the
 * server-provided instant, after which React switches to the real clock and
 * re-renders every minute.
 */
export function useNow(initialIso: string): Date {
  const initial = useMemo(() => new Date(initialIso).getTime(), [initialIso]);
  const time = useSyncExternalStore(subscribe, currentMinute, () => initial);
  return useMemo(() => new Date(time), [time]);
}
