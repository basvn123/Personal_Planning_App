"use server";

import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { documents, documentSections, sections } from "@/db/schema";
import { DYES } from "@/lib/dyes";
import { rankBetween } from "@/lib/rank";
import { slugify } from "@/lib/slug";
import { requireUserId } from "@/server/auth";

const nameSchema = z.string().trim().min(1).max(80);
const dyeSchema = z.enum(DYES);

async function uniqueSlug(userId: string, name: string, exceptId?: string) {
  const base = slugify(name);
  const taken = await db
    .select({ slug: sections.slug })
    .from(sections)
    .where(
      and(
        eq(sections.userId, userId),
        sql`${sections.slug} ~ ${`^${base}(-[0-9]+)?$`}`,
        exceptId ? ne(sections.id, exceptId) : undefined,
      ),
    );
  const set = new Set(taken.map((t) => t.slug));
  if (!set.has(base)) return base;
  let n = 2;
  while (set.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Throws unless the section exists and belongs to this person. */
async function assertOwnSection(userId: string, id: string) {
  const [row] = await db
    .select({ id: sections.id })
    .from(sections)
    .where(and(eq(sections.id, id), eq(sections.userId, userId)));
  if (!row) throw new Error("Section not found");
}

export async function createSection(input: { name: string; color: string; parentId?: string | null }) {
  const userId = await requireUserId();
  const name = nameSchema.parse(input.name);
  const color = dyeSchema.parse(input.color);
  const parentId = input.parentId ? z.uuid().parse(input.parentId) : null;
  if (parentId) await assertOwnSection(userId, parentId);

  const [last] = await db
    .select({ rank: sections.rank })
    .from(sections)
    .where(and(eq(sections.userId, userId), parentId ? eq(sections.parentId, parentId) : isNull(sections.parentId)))
    .orderBy(desc(sections.rank))
    .limit(1);

  const [row] = await db
    .insert(sections)
    .values({
      userId,
      name,
      color,
      parentId,
      slug: await uniqueSlug(userId, name),
      rank: rankBetween(last?.rank ?? null, null),
    })
    .returning();
  revalidatePath("/", "layout");
  return { slug: row.slug, id: row.id };
}

export async function updateSection(
  id: string,
  patch: { name?: string; color?: string; parentId?: string | null },
) {
  const userId = await requireUserId();
  z.uuid().parse(id);
  await assertOwnSection(userId, id);
  const values: Partial<typeof sections.$inferInsert> = {};
  if (patch.name !== undefined) {
    values.name = nameSchema.parse(patch.name);
    values.slug = await uniqueSlug(userId, values.name, id);
  }
  if (patch.color !== undefined) values.color = dyeSchema.parse(patch.color);
  if (patch.parentId !== undefined) {
    if (patch.parentId === null) values.parentId = null;
    else {
      const parentId = z.uuid().parse(patch.parentId);
      await assertOwnSection(userId, parentId);
      // Refuse cycles: the new parent may not be this section or one of its descendants.
      const descendants = await db.execute<{ id: string }>(sql`
        with recursive tree as (
          select id from sections where id = ${id}
          union all
          select s.id from sections s join tree t on s.parent_id = t.id
        ) select id from tree
      `);
      if (descendants.some((d) => d.id === parentId)) throw new Error("Een sectie kan niet in zichzelf zitten.");
      values.parentId = parentId;
    }
  }
  const [row] = await db
    .update(sections)
    .set(values)
    .where(and(eq(sections.id, id), eq(sections.userId, userId)))
    .returning();
  revalidatePath("/", "layout");
  return { slug: row.slug };
}

/** Moves a section between two neighbours (by id) in the same level. */
export async function moveSection(id: string, beforeId: string | null, afterId: string | null) {
  const userId = await requireUserId();
  const ids = [beforeId, afterId].filter(Boolean) as string[];
  const neighbours = ids.length
    ? await db
        .select({ id: sections.id, rank: sections.rank })
        .from(sections)
        .where(and(eq(sections.userId, userId), inArray(sections.id, ids)))
    : [];
  const rankOf = (nid: string | null) => neighbours.find((n) => n.id === nid)?.rank ?? null;
  let before = rankOf(beforeId);
  let after = rankOf(afterId);
  if (before && after && before >= after) [before, after] = [after, before];
  await db
    .update(sections)
    .set({ rank: rankBetween(before, after) })
    .where(and(eq(sections.id, id), eq(sections.userId, userId)));
  revalidatePath("/", "layout");
}

export async function archiveSection(id: string, archived: boolean) {
  const userId = await requireUserId();
  await db
    .update(sections)
    .set({ archivedAt: archived ? new Date() : null })
    .where(and(eq(sections.id, z.uuid().parse(id)), eq(sections.userId, userId)));
  revalidatePath("/", "layout");
}

/** Deletes a section and every document that belongs to no other section. */
export async function deleteSection(id: string) {
  const userId = await requireUserId();
  z.uuid().parse(id);
  await assertOwnSection(userId, id);
  await db.transaction(async (tx) => {
    const own = await tx
      .select({ documentId: documentSections.documentId })
      .from(documentSections)
      .where(eq(documentSections.sectionId, id));
    const docIds = own.map((o) => o.documentId);
    if (docIds.length) {
      const shared = await tx
        .selectDistinct({ documentId: documentSections.documentId })
        .from(documentSections)
        .where(and(inArray(documentSections.documentId, docIds), ne(documentSections.sectionId, id)));
      const keep = new Set(shared.map((s) => s.documentId));
      const drop = docIds.filter((d) => !keep.has(d));
      if (drop.length) await tx.delete(documents).where(inArray(documents.id, drop));
    }
    await tx.update(sections).set({ parentId: null }).where(eq(sections.parentId, id));
    await tx.delete(sections).where(eq(sections.id, id));
  });
  revalidatePath("/", "layout");
}

export async function listSectionOptions() {
  const userId = await requireUserId();
  return db
    .select({ id: sections.id, name: sections.name, parentId: sections.parentId })
    .from(sections)
    .where(and(eq(sections.userId, userId), isNull(sections.archivedAt)))
    .orderBy(asc(sections.rank));
}
