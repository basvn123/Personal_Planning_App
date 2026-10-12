import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

/** Lexicographic sort keys: insert between any two items without renumbering. */
export function rankBetween(before: string | null, after: string | null) {
  return generateKeyBetween(before, after);
}

export function ranksAfter(last: string | null, count: number) {
  return generateNKeysBetween(last, null, count);
}
