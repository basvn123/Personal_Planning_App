"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { documents, documentSections, documentTags, documentTasks, tags } from "@/db/schema";
import { requireUserId } from "@/server/auth";
import { saveDocumentContent } from "@/server/documents";
import { ownDocuments, ownSections, ownTasks } from "@/server/own";

const uuid = z.uuid();

export async function createDocument(sectionId: string) {
  const userId = await requireUserId();
  uuid.parse(sectionId);
  await ownSections(userId, sectionId);
  const id = await db.transaction(async (tx) => {
    const [doc] = await tx.insert(documents).values({ userId }).returning({ id: documents.id });
    await tx.insert(documentSections).values({ documentId: doc.id, sectionId });
    return doc.id;
  });
  revalidatePath("/s", "layout");
  return id;
}

export async function saveDocument(id: string, patch: { title?: string; contentMd?: string }) {
  const userId = await requireUserId();
  await saveDocumentContent(userId, id, patch);
  const [row] = await db
    .select({ updatedAt: documents.updatedAt })
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)));
  if (patch.title !== undefined) revalidatePath("/s", "layout");
  return { updatedAt: row?.updatedAt.toISOString() ?? null };
}

export async function setDocumentPinned(id: string, pinned: boolean) {
  const userId = await requireUserId();
  await db
    .update(documents)
    .set({ pinned })
    .where(and(eq(documents.id, uuid.parse(id)), eq(documents.userId, userId)));
  revalidatePath("/s", "layout");
}

export async function deleteDocument(id: string) {
  const userId = await requireUserId();
  await db.delete(documents).where(and(eq(documents.id, uuid.parse(id)), eq(documents.userId, userId)));
  revalidatePath("/s", "layout");
}

export async function linkDocumentSection(documentId: string, sectionId: string, linked: boolean) {
  const userId = await requireUserId();
  uuid.parse(documentId);
  uuid.parse(sectionId);
  await ownDocuments(userId, documentId);
  await ownSections(userId, sectionId);
  if (linked) {
    await db.insert(documentSections).values({ documentId, sectionId }).onConflictDoNothing();
  } else {
    // A document always keeps at least one section.
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(documentSections)
      .where(eq(documentSections.documentId, documentId));
    if (count <= 1) throw new Error("A document needs at least one section.");
    await db
      .delete(documentSections)
      .where(and(eq(documentSections.documentId, documentId), eq(documentSections.sectionId, sectionId)));
  }
  revalidatePath("/s", "layout");
}

export async function linkDocumentTask(documentId: string, taskId: string, linked: boolean) {
  const userId = await requireUserId();
  uuid.parse(documentId);
  uuid.parse(taskId);
  await ownDocuments(userId, documentId);
  await ownTasks(userId, taskId);
  if (linked) await db.insert(documentTasks).values({ documentId, taskId }).onConflictDoNothing();
  else
    await db
      .delete(documentTasks)
      .where(and(eq(documentTasks.documentId, documentId), eq(documentTasks.taskId, taskId)));
  revalidatePath("/", "layout");
}

/** Replaces a document's tags with the given names, creating tags as needed. */
export async function setDocumentTags(documentId: string, names: string[]) {
  const userId = await requireUserId();
  uuid.parse(documentId);
  await ownDocuments(userId, documentId);
  const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean).map((n) => n.slice(0, 40)))];
  await db.transaction(async (tx) => {
    let tagIds: string[] = [];
    if (clean.length) {
      await tx
        .insert(tags)
        .values(clean.map((name) => ({ userId, name })))
        .onConflictDoNothing();
      const rows = await tx
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.userId, userId), inArray(sql`lower(${tags.name})`, clean.map((n) => n.toLowerCase()))));
      tagIds = rows.map((r) => r.id);
    }
    await tx.delete(documentTags).where(eq(documentTags.documentId, documentId));
    if (tagIds.length) await tx.insert(documentTags).values(tagIds.map((tagId) => ({ documentId, tagId })));
  });
  revalidatePath("/s", "layout");
}
