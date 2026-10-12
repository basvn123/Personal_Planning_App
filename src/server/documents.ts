import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { documents } from "@/db/schema";

const uuid = z.uuid();

export const docPatchSchema = z.object({
  title: z.string().max(300).optional(),
  contentMd: z.string().max(2_000_000).optional(),
});

/** Shared by the server action and the unload beacon route. Only touches the owner's document. */
export async function saveDocumentContent(userId: string, id: string, patch: z.infer<typeof docPatchSchema>) {
  uuid.parse(id);
  const values = docPatchSchema.parse(patch);
  if (values.title === undefined && values.contentMd === undefined) return;
  await db
    .update(documents)
    .set(values)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)));
}
