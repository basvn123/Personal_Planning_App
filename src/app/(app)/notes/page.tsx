import type { Metadata } from "next";
import { NotebookPen } from "lucide-react";
import { z } from "zod";
import { Spread } from "@/components/shell/spread";
import { DocEditor } from "@/components/docs/doc-editor";
import { NotesList } from "@/components/docs/notes-list";
import { notesHref } from "@/lib/notes";
import { EmptyState } from "@/components/ui/empty-state";
import { pageBody } from "@/components/ui/page-body";
import { getAllTagNames, getDocument, getNotes } from "@/server/queries/sections";
import { getSections } from "@/server/queries/core";

export const metadata: Metadata = { title: "Notities" };

/**
 * All notes in one place, like a notes app: general notes that belong to no
 * section, and every section's documents as its own folder. The list sits on the
 * left page, the open note on the right; everything saves as you type.
 */
export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; n?: string; new?: string }>;
}) {
  const [{ f, n, new: isNew }, notes, all, tags] = await Promise.all([searchParams, getNotes(), getSections(), getAllTagNames()]);
  const sections = all.map(({ id, name, slug, color }) => ({ id, name, slug, color }));
  const folder = f === "general" || sections.some((s) => s.slug === f) ? f! : "all";
  const noteId = n && z.uuid().safeParse(n).success ? n : null;
  const doc = noteId ? await getDocument(noteId) : null;

  const left = (
    <div className={pageBody}>
      <NotesList notes={notes} sections={sections} folder={folder} selected={doc?.id ?? null} />
    </div>
  );

  const right = doc ? (
    <DocEditor
      key={doc.id}
      doc={{
        id: doc.id,
        title: doc.title,
        contentMd: doc.contentMd,
        pinned: doc.pinned,
        sections: doc.sections,
        tags: doc.tags,
      }}
      currentSlug={folder !== "all" && folder !== "general" ? folder : ""}
      allSections={sections}
      allTags={tags}
      isNew={isNew === "1"}
      backHref={notesHref(folder)}
    />
  ) : (
    <div className={pageBody}>
      <div className="rounded-xl border border-rule bg-card px-4 py-6">
        <EmptyState icon={NotebookPen} text="Kies een notitie links, of maak een nieuwe. Alles wordt meteen bewaard." />
      </div>
    </div>
  );

  return (
    <Spread
      // A phone opens on the note itself when one is picked, on the list otherwise.
      key={doc?.id ?? "list"}
      left={left}
      right={right}
      leftLabel="Notities"
      rightLabel={doc ? "Notitie" : "Open notitie"}
      initial={doc ? "right" : "left"}
    />
  );
}
