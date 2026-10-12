"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { head } from "@vercel/blob";
import { z } from "zod";
import { db } from "@/db/client";
import { files } from "@/db/schema";
import { MAX_FILE_BYTES, safeFileName } from "@/lib/files";
import { requireUserId } from "@/server/auth";
import { ownSections } from "@/server/own";
import { removeStored } from "@/server/storage";

/**
 * Records a file the browser just uploaded straight to Vercel Blob.
 * The blob must sit under this person's own prefix and really exist.
 */
export async function registerBlobFile(input: { sectionId: string; pathname: string; name: string }) {
  const userId = await requireUserId();
  const v = z
    .object({ sectionId: z.uuid(), pathname: z.string().min(1).max(500), name: z.string().min(1).max(300) })
    .parse(input);
  await ownSections(userId, v.sectionId);
  if (!v.pathname.startsWith(`u/${userId}/${v.sectionId}/`)) throw new Error("Not your upload");
  const blob = await head(v.pathname);
  if (blob.size > MAX_FILE_BYTES) throw new Error("Too large");
  const [row] = await db
    .insert(files)
    .values({
      userId,
      sectionId: v.sectionId,
      name: safeFileName(v.name),
      contentType: blob.contentType || "application/octet-stream",
      size: blob.size,
      storageKey: `blob:${v.pathname}`,
      url: blob.url,
    })
    .returning({ id: files.id });
  revalidatePath("/", "layout");
  return row.id;
}

export async function renameFile(id: string, name: string) {
  const userId = await requireUserId();
  await db
    .update(files)
    .set({ name: safeFileName(z.string().trim().min(1).max(180).parse(name)) })
    .where(and(eq(files.id, z.uuid().parse(id)), eq(files.userId, userId)));
  revalidatePath("/", "layout");
}

export async function deleteFile(id: string) {
  const userId = await requireUserId();
  const [row] = await db
    .delete(files)
    .where(and(eq(files.id, z.uuid().parse(id)), eq(files.userId, userId)))
    .returning({ storageKey: files.storageKey });
  if (row) await removeStored(row.storageKey).catch(() => {});
  revalidatePath("/", "layout");
}
