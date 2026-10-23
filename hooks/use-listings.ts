"use client";

import { useCallback, useEffect, useState } from "react";
import { listingsRepository } from "@/lib/data/repository";
import type { Listing } from "@/types";

interface ListingsState {
  listings: readonly Listing[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

interface Settled {
  attempt: number;
  listings: readonly Listing[];
  error: string | null;
}

export function useListings(): ListingsState {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    let cancelled = false;
    listingsRepository
      .loadAll()
      .then((listings) => {
        if (!cancelled) setSettled({ attempt, listings, error: null });
      })
      .catch(() => {
        if (!cancelled) setSettled({ attempt, listings: [], error: "Please check your connection and try again." });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  // Loading is derived: the latest attempt has not settled yet.
  const loading = settled?.attempt !== attempt;
  return { listings: settled?.listings ?? [], loading, error: loading ? null : (settled?.error ?? null), reload };
}
