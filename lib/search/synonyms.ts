/**
 * Groups of terms that should find each other (English + common Filipino words).
 * Matching is prefix-based on normalised words, so "dentist" also finds "dentistry".
 */
const GROUPS: readonly (readonly string[])[] = [
  ["dentist", "dental", "dentistry", "orthodontist", "braces", "teeth"],
  ["pharmacy", "botika", "drugstore", "medicine", "pharmacist"],
  ["clinic", "doctor", "medical", "health", "hospital"],
  ["restaurant", "kainan", "carinderia", "eatery", "food", "cafe", "coffee", "grill"],
  ["grocery", "supermarket", "palengke", "market", "store", "mart"],
  ["school", "eskwela", "elementary", "deped", "enrollment", "campus"],
  ["curfew", "ordinance", "regulation", "ordinansa"],
  ["closure", "closed", "detour", "traffic", "road", "trapiko"],
  ["barangay", "brgy", "barangay hall"],
  ["government", "lgu", "municipal", "permit", "mayor"],
  ["event", "festival", "pista", "fiesta", "activity", "run"],
  ["laundry", "labada"],
  ["tricycle", "transport", "terminal"],
];

const index = new Map<string, readonly string[]>();
for (const group of GROUPS) {
  for (const term of group) index.set(term, group);
}

export function expandTerm(term: string): readonly string[] {
  const direct = index.get(term);
  if (direct) return direct;
  // Allow partial typing: "dent" should still expand through "dentist".
  for (const [key, group] of index) {
    if (term.length >= 3 && key.startsWith(term)) return group;
  }
  return [term];
}

export const SUGGESTION_VOCABULARY: readonly string[] = GROUPS.flatMap((g) => g.slice(0, 3));
