import "server-only";
import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { documents, documentSections, documentTags, files, sections, tags } from "@/db/schema";
import { requireUserId } from "@/server/auth";

export async function getSectionBySlug(slug: string) {
  const userId = await requireUserId();
  const [row] = await db
    .select()
    .from(sections)
    .where(and(eq(sections.userId, userId), eq(sections.slug, slug)));
  return row ?? null;
}

export async function getChildSections(parentId: string) {
  const userId = await requireUserId();
  return db
    .select()
    .from(sections)
    .where(and(eq(sections.userId, userId), eq(sections.parentId, parentId), isNull(sections.archivedAt)))
    .orderBy(asc(sections.rank));
}

export async function getArchivedSections() {
  const userId = await requireUserId();
  return db
    .select()
    .from(sections)
    .where(and(eq(sections.userId, userId), isNotNull(sections.archivedAt)))
    .orderBy(asc(sections.name));
}

export async function getSectionDocuments(sectionId: string) {
  const userId = await requireUserId();
  return db
    .select({
      id: documents.id,
      title: documents.title,
      pinned: documents.pinned,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .innerJoin(documentSections, eq(documentSections.documentId, documents.id))
    .where(and(eq(documents.userId, userId), eq(documentSections.sectionId, sectionId)))
    .orderBy(desc(documents.pinned), desc(documents.updatedAt));
}

export async function getSectionFiles(sectionId: string) {
  const userId = await requireUserId();
  return db
    .select()
    .from(files)
    .where(and(eq(files.userId, userId), eq(files.sectionId, sectionId)))
    .orderBy(desc(files.createdAt));
}

export async function getDocument(id: string) {
  const userId = await requireUserId();
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.id, id)));
  if (!doc) return null;
  const [sectionRows, tagRows] = await Promise.all([
    db
      .select({ id: sections.id, name: sections.name, slug: sections.slug, color: sections.color })
      .from(documentSections)
      .innerJoin(sections, eq(sections.id, documentSections.sectionId))
      .where(eq(documentSections.documentId, id)),
    db
      .select({ name: tags.name })
      .from(documentTags)
      .innerJoin(tags, eq(tags.id, documentTags.tagId))
      .where(eq(documentTags.documentId, id))
      .orderBy(asc(tags.name)),
  ]);
  return { ...doc, sections: sectionRows, tags: tagRows.map((t) => t.name) };
}

export async function getAllTagNames() {
  const userId = await requireUserId();
  const rows = await db.select({ name: tags.name }).from(tags).where(eq(tags.userId, userId)).orderBy(asc(tags.name));
  return rows.map((r) => r.name);
}

export type NoteItem = {
  id: string;
  title: string;
  snippet: string;
  pinned: boolean;
  updatedAt: string;
  sections: { id: string; name: string; slug: string; color: string }[];
};

/** Every document as a note: pinned first, then most recently edited. `snippet` is the start of the text, enough to search and preview. */
export async function getNotes(): Promise<NoteItem[]> {
  const userId = await requireUserId();
  const rows = await db.execute<{
    id: string;
    title: string;
    snippet: string;
    pinned: boolean;
    updated_at: Date;
    sections: NoteItem["sections"] | null;
  }>(sql`
    select d.id, d.title, left(d.content_md, 4000) as snippet, d.pinned, d.updated_at,
      (select json_agg(json_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'color', s.color) order by s.name)
         from document_sections ds join sections s on s.id = ds.section_id
         where ds.document_id = d.id) as sections
    from documents d
    where d.user_id = ${userId}
    order by d.pinned desc, d.updated_at desc
  `);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    snippet: r.snippet,
    pinned: r.pinned,
    updatedAt: new Date(r.updated_at).toISOString(),
    sections: r.sections ?? [],
  }));
}
