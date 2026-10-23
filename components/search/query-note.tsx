import { Sparkles } from "lucide-react";
import { interpretQuery } from "@/lib/search/query";

/** Tells people how their words were understood, so results never feel arbitrary. */
export function QueryNote({ query }: { query: string }) {
  const { tokens, intents } = interpretQuery(query);
  if (!query.trim()) return null;

  const understood = intents.length > 0 ? intents.join(" + ") : null;
  const keywords = tokens.join(" ");
  const showKeywords = keywords.length > 0 && keywords !== query.trim().toLowerCase();
  if (!understood && !showKeywords) return null;

  return (
    <p className="flex items-start gap-1.5 rounded-lg bg-primary/8 px-2.5 py-1.5 text-xs text-foreground" role="status">
      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
      <span>
        {understood ? <strong className="font-semibold">{understood}</strong> : "Searching"}
        {showKeywords && <span className="text-muted-foreground"> · keywords: {keywords}</span>}
      </span>
    </p>
  );
}
