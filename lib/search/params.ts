import { CATEGORIES } from "@/data/categories";
import type { CategoryId } from "@/types";

type RawParam = string | string[] | undefined;

export function firstParam(value: RawParam): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCategory(value: RawParam): CategoryId {
  const first = firstParam(value);
  return CATEGORIES.find((c) => c.id === first)?.id ?? "all";
}
