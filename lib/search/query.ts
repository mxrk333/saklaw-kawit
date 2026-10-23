import { normalize } from "./normalize";

export interface InterpretedQuery {
  /** Keywords that results must match (every one of them). */
  tokens: string[];
  /** Plain-language labels for the questions we recognised, e.g. "Places to stay". */
  intents: string[];
}

/** Words that carry no search meaning, plus words true of everything here ("kawit"). */
const IGNORED = new Set(
  [
    "the", "a", "an", "of", "in", "at", "to", "for", "near", "nearby", "around", "me", "my", "i", "we", "you",
    "is", "are", "can", "do", "does", "what", "where", "which", "how", "find", "show", "get", "any", "some",
    "there", "best", "good", "open", "now", "and", "or", "with", "on", "from", "it", "this", "that",
    "place", "places", "kawit", "cavite", "philippines",
  ],
);

/** Whole questions mapped to one canonical keyword the data is tagged with. */
const PHRASES: ReadonlyArray<{ pattern: RegExp; label: string; term: string }> = [
  {
    pattern:
      /\b(where (can|do|should) (i|we|you) (stay|sleep)|where to (stay|sleep)|places? to (stay|sleep)|(stay|sleep) (overnight|for the night)|accommodations?|lodging|matutuluyan|tutuluyan)\b/g,
    label: "Places to stay",
    term: "hotel",
  },
  {
    pattern:
      /\b(tourist (spots?|attractions?|destinations?|places?)|tourism|things to do|places? to (visit|go)|what to see|sightseeing|pasyalan|landmarks?|historical sites?)\b/g,
    label: "Tourist attractions",
    term: "attraction",
  },
  { pattern: /\b(shopping (malls?|centers?|centres?)|where to shop)\b/g, label: "Malls", term: "mall" },
  { pattern: /\b(where to eat|places? to eat|food places?|kainan)\b/g, label: "Places to eat", term: "restaurant" },
  { pattern: /\b(where to buy medicines?|medicines?)\b/g, label: "Pharmacies", term: "pharmacy" },
];

/**
 * Turns what someone typed into keywords. Natural questions ("where can I stay
 * in Kawit?") are rewritten to a keyword the data uses ("hotel"), and filler
 * words are dropped, so people don't have to guess exact wording.
 */
export function interpretQuery(query: string): InterpretedQuery {
  let text = normalize(query);
  const intents: string[] = [];

  for (const { pattern, label, term } of PHRASES) {
    if (pattern.test(text)) {
      intents.push(label);
      text = text.replace(pattern, ` ${term} `);
    }
    pattern.lastIndex = 0;
  }

  const tokens = text
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0 && !IGNORED.has(word));
  return { tokens, intents };
}
