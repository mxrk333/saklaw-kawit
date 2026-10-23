"use client";

import { useEffect } from "react";
import type { CategoryId } from "@/types";

/** Keeps the URL shareable (?q, ?category, ?selected) without triggering navigation. */
export function useUrlSync(query: string, category: CategoryId, selectedKey: string | null): void {
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "all") params.set("category", category);
    if (selectedKey) params.set("selected", selectedKey);
    const search = params.toString();
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
  }, [query, category, selectedKey]);
}
