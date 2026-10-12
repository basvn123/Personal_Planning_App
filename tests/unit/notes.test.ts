import { describe, expect, it } from "vitest";
import { matchesNote, notePreview, noteTitle } from "@/lib/notes";

describe("notes", () => {
  it("previews markdown as one line of plain text", () => {
    expect(notePreview("# Kop\n\n- [ ] **vet** punt\n> citaat met [link](https://x.be)")).toBe("Kop vet punt citaat met link");
    expect(notePreview("```js\ncode()\n```\nna de code")).toBe("na de code");
    expect(notePreview("a".repeat(200), 10)).toBe("aaaaaaaaa…");
  });
  it("falls back to the first line for an untitled note", () => {
    expect(noteTitle("", "\n## Boodschappen\nmelk")).toBe("Boodschappen");
    expect(noteTitle("  ", "")).toBe("Nieuwe notitie");
    expect(noteTitle("Eigen titel", "tekst")).toBe("Eigen titel");
  });
  it("searches title and text, ignoring case and accents", () => {
    expect(matchesNote("CAFÉ lijst", "Boodschappen", "koffie voor het cafe\nlijst")).toBe(true);
    expect(matchesNote("prompt", "Claude skills", "skill.md schrijven")).toBe(false);
    expect(matchesNote("  ", "x", "y")).toBe(true);
  });
});
