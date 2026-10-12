/**
 * Plain-text helpers for the Notities list: a readable one-line preview of a
 * markdown note, and the search match (title and text, accents and case ignored).
 */

/** Markdown to a single line of plain text, at most `max` characters. */
export function notePreview(markdown: string, max = 140): string {
  const text = markdown
    .replace(/```[\s\S]*?(```|$)/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+(\[[ xX]\]\s+)?|\d+[.)]\s+)/gm, "")
    .replace(/[*_`~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** The title to show: the note's own, or its first line, or a placeholder. */
export function noteTitle(title: string, markdown: string): string {
  if (title.trim()) return title.trim();
  const first = notePreview(markdown.split("\n").find((l) => l.trim()) ?? "", 80);
  return first || "Nieuwe notitie";
}

function fold(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Every word of the query appears somewhere in the title or the text. */
export function matchesNote(query: string, title: string, markdown: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const hay = fold(`${title}\n${markdown}`);
  return words.every((w) => hay.includes(w));
}
