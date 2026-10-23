import { CATEGORIES } from "@/data/categories";
import type { Listing } from "@/types";
import { normalize } from "./engine";
import { SUGGESTION_VOCABULARY } from "./synonyms";

export const DEFAULT_SUGGESTIONS: readonly string[] = [
  "Where to stay",
  "Tourist attractions",
  "Malls",
  "Coffee shop",
  "Hospital",
  "Police station",
  "Pharmacy",
  "Water station",
  "Talipapa",
  "Restaurants",
  "Dentist",
  "Barangay hall",
];

/** Full questions people might type; they are understood by lib/search/query.ts. */
const QUESTION_SUGGESTIONS: readonly string[] = [
  "Where can I stay in Kawit?",
  "What are the tourist attractions?",
  "Where to eat",
  "Where to buy medicine",
];

const MAX_SUGGESTIONS = 6;

export function getSuggestions(input: string, listings: readonly Listing[]): string[] {
  const needle = normalize(input.trim());
  if (!needle) return [...DEFAULT_SUGGESTIONS];

  const pool = new Set<string>([
    ...DEFAULT_SUGGESTIONS,
    ...QUESTION_SUGGESTIONS,
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
