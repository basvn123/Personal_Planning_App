import "server-only";
import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { documents, documentSections, documentTags, sections, tags } from "@/db/schema";

export async function getSectionBySlug(slug: string) {
  const [row] = await db.select().from(sections).where(eq(sections.slug, slug));
  return row ?? null;
}

export async function getChildSections(parentId: string) {
  return db
    .select()
    .from(sections)
    .where(and(eq(sections.parentId, parentId), isNull(sections.archivedAt)))
    .orderBy(asc(sections.rank));
}

export async function getArchivedSections() {
  return db.select().from(sections).where(isNotNull(sections.archivedAt)).orderBy(asc(sections.name));
}

export async function getSectionDocuments(sectionId: string) {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      pinned: documents.pinned,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .innerJoin(documentSections, eq(documentSections.documentId, documents.id))
    .where(eq(documentSections.sectionId, sectionId))
    .orderBy(desc(documents.pinned), desc(documents.updatedAt));
}

export async function getDocument(id: string) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
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
  const rows = await db.select({ name: tags.name }).from(tags).orderBy(asc(tags.name));
  return rows.map((r) => r.name);
}
