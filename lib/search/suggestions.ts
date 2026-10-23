import { CATEGORIES } from "@/data/categories";
import type { Listing } from "@/types";
import { normalize } from "./engine";
import { SUGGESTION_VOCABULARY } from "./synonyms";

export const DEFAULT_SUGGESTIONS: readonly string[] = [
  "Dentist",
  "Pharmacy",
  "Restaurants",
  "Grocery",
  "Barangay hall",
  "Curfew",
  "Road closure",
  "Events this week",
];

const MAX_SUGGESTIONS = 6;

export function getSuggestions(input: string, listings: readonly Listing[]): string[] {
  const needle = normalize(input.trim());
  if (!needle) return [...DEFAULT_SUGGESTIONS];

  const pool = new Set<string>([
    ...DEFAULT_SUGGESTIONS,
    ...SUGGESTION_VOCABULARY.map(capitalize),
    ...CATEGORIES.filter((c) => c.id !== "all").map((c) => c.label),
    ...listings.map((l) => l.title),
  ]);

  const starts: string[] = [];
  const contains: string[] = [];
  for (const candidate of pool) {
    const normalized = normalize(candidate);
    if (normalized === needle) continue;
    if (normalized.startsWith(needle)) starts.push(candidate);
    else if (normalized.includes(needle)) contains.push(candidate);
  }
  return [...starts, ...contains].slice(0, MAX_SUGGESTIONS);
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
