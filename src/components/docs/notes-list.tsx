"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { format, isSameDay, isSameYear, differenceInCalendarDays } from "date-fns";
import { nl } from "date-fns/locale";
import { NotebookPen, Pin, Plus, Search, X } from "lucide-react";
import { createDocument } from "@/server/actions/documents";
import { matchesNote, notePreview, noteTitle } from "@/lib/notes";
import { dyeVars } from "@/lib/dyes";
import { useUi } from "@/lib/ui-store";
import { cx } from "@/lib/cx";
import { EmptyState } from "@/components/ui/empty-state";
import type { NoteItem } from "@/server/queries/sections";

type Section = { id: string; name: string; slug: string; color: string };

/** "all", "general" (notes in no section) or a section slug. */
export type Folder = string;

function when(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (isSameDay(d, now)) return format(d, "HH:mm");
  if (differenceInCalendarDays(now, d) < 7) return format(d, "EEEE", { locale: nl });
  return format(d, isSameYear(d, now) ? "d MMM" : "d MMM yyyy", { locale: nl });
}

export function notesHref(folder: Folder, noteId?: string, isNew?: boolean) {
  const q = new URLSearchParams();
  if (folder !== "all") q.set("f", folder);
  if (noteId) q.set("n", noteId);
  if (isNew) q.set("new", "1");
  const s = q.toString();
  return s ? `/notes?${s}` : "/notes";
}

/**
 * Notes like a notes app: folders on top (all, general, one per section), a search
 * that looks through titles and text, and the list, pinned notes first. A new note
 * lands in the folder you are in.
 */
export function NotesList({
  notes,
  sections,
  folder,
  selected,
}: {
  notes: NoteItem[];
  sections: Section[];
  folder: Folder;
  selected: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [creating, startCreate] = useTransition();

  const section = sections.find((s) => s.slug === folder) ?? null;
  const inFolder = useMemo(
    () =>
      notes.filter((n) =>
        folder === "all" ? true : folder === "general" ? n.sections.length === 0 : n.sections.some((s) => s.slug === folder),
      ),
    [notes, folder],
  );
  const shown = inFolder.filter((n) => matchesNote(query, n.title, n.snippet));
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: notes.length, general: 0 };
    for (const n of notes) {
      if (n.sections.length === 0) c.general++;
      for (const s of n.sections) c[s.slug] = (c[s.slug] ?? 0) + 1;
    }
    return c;
  }, [notes]);

  function newNote() {
    startCreate(async () => {
      try {
        const id = await createDocument(section?.id ?? null);
        router.push(notesHref(folder, id, true));
      } catch {
        useUi.getState().showToast("Niet aangemaakt, probeer opnieuw");
      }
    });
  }

  const folders: { key: Folder; label: string; color?: string }[] = [
    { key: "all", label: "Alle" },
    { key: "general", label: "Algemeen" },
    ...sections.map((s) => ({ key: s.slug, label: s.name, color: s.color })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center gap-2 px-1 pt-2">
        <h1 className="flex-1 text-2xl font-bold leading-tight tracking-[-0.025em] text-ink">Notities</h1>
        <button
          type="button"
          onClick={newNote}
          disabled={creating}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-cloth px-4 text-sm font-semibold text-cloth-ink transition-colors active:bg-cloth-3 disabled:opacity-60 lg:h-9"
        >
          <Plus className="size-4" strokeWidth={2.25} />
          Nieuwe notitie
        </button>
      </header>

      <nav aria-label="Mappen" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {folders.map((f) => {
          const on = f.key === folder;
          return (
            <Link
              key={f.key}
              href={notesHref(f.key)}
              aria-current={on ? "page" : undefined}
              style={f.color ? dyeVars(f.color) : undefined}
              className={cx(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors lg:h-8",
                on ? "bg-cloth text-cloth-ink" : "bg-paper-3 text-ink-2 hover:text-ink",
              )}
            >
              {f.color && <span className="size-2 rounded-[2px] bg-[var(--dye)]" />}
              {f.label}
              <span className={cx("figures text-xs", on ? "text-cloth-ink-2" : "text-ink-3")}>{counts[f.key] ?? 0}</span>
            </Link>
          );
        })}
      </nav>

      <label className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 size-4 text-ink-3" strokeWidth={1.75} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={section ? `Zoeken in ${section.name}` : folder === "general" ? "Zoeken in Algemeen" : "Zoeken in alle notities"}
          aria-label="Notities zoeken"
          className="h-10 w-full rounded-md border border-rule-strong bg-paper pl-9 pr-9 text-base text-ink outline-none placeholder:text-ink-3 focus:border-cloth-3 lg:h-9 lg:text-sm"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Zoekterm wissen" className="absolute right-2 grid size-7 place-items-center rounded-full text-ink-3 hover:text-ink">
            <X className="size-4" strokeWidth={2} />
          </button>
        )}
      </label>

      <section aria-label="Notities" className="rounded-xl border border-rule bg-card shadow-[0_1px_2px_oklch(0.2_0.02_258/0.04)]">
        {shown.length === 0 ? (
          <div className="px-4 py-3">
            <EmptyState
              icon={NotebookPen}
              text={
                query
                  ? "Geen notities gevonden met die woorden."
                  : folder === "general"
                    ? "Nog geen algemene notities. Een notitie zonder sectie komt hier."
                    : section
                      ? `Nog geen notities in ${section.name}.`
                      : "Nog geen notities. Maak er een met Nieuwe notitie."
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-rule">
            {shown.map((n) => {
              // An untitled note shows its first line as the title, so the preview starts after it.
              const preview = n.title.trim()
                ? notePreview(n.snippet)
                : notePreview(n.snippet.split("\n").filter((l) => l.trim()).slice(1).join("\n"));
              const on = n.id === selected;
              return (
                <li key={n.id}>
                  <Link
                    href={notesHref(folder, n.id)}
                    aria-current={on ? "page" : undefined}
                    className={cx(
                      "flex flex-col gap-0.5 px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl",
                      on ? "bg-ribbon-wash" : "hover:bg-paper-2 active:bg-paper-3",
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {n.pinned && <Pin className="size-3.5 shrink-0 text-ribbon-ink" strokeWidth={2} fill="currentColor" aria-label="Vastgezet" />}
                      <span className="min-w-0 flex-1 truncate text-base font-semibold text-ink">{noteTitle(n.title, n.snippet)}</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <span className="figures shrink-0 text-ink-2 first-letter:uppercase">{when(n.updatedAt)}</span>
                      <span className="min-w-0 truncate text-ink-3">{preview || "Geen extra tekst"}</span>
                    </span>
                    {folder === "all" || n.sections.length > 1 ? (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {n.sections.length === 0 ? (
                          <span className="rounded-xs bg-paper-3 px-1.5 py-px text-2xs text-ink-2">Algemeen</span>
                        ) : (
                          n.sections.map((s) => (
                            <span key={s.id} style={dyeVars(s.color)} className="inline-flex items-center gap-1 rounded-xs bg-paper-3 px-1.5 py-px text-2xs text-ink-2">
                              <span className="size-1.5 rounded-full bg-[var(--dye-deep)]" />
                              {s.name}
                            </span>
                          ))
                        )}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
