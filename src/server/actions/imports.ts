"use server";

import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { imports, sections, tasks } from "@/db/schema";
import { DYES } from "@/lib/dyes";
import { ranksAfter } from "@/lib/rank";
import { slugify } from "@/lib/slug";

const rowSchema = z.object({
  title: z.string().trim().min(1).max(300),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  minutes: z.number().int().min(1).max(1440).nullable(),
  sectionName: z.string().max(80).nullable(),
  notes: z.string().max(20_000),
});

const importSchema = z.object({
  filename: z.string().max(200),
  kind: z.enum(["csv", "json"]),
  defaultSectionId: z.uuid(),
  createSections: z.boolean(),
  rows: z.array(rowSchema).min(1).max(2000),
});

/** Imports planned tasks in one transaction, tagged with an import id so they can be undone together. */
export async function importTasks(input: z.input<typeof importSchema>) {
  const v = importSchema.parse(input);
  return db.transaction(async (tx) => {
    const existing = await tx.select({ id: sections.id, name: sections.name, rank: sections.rank }).from(sections);
    const byName = new Map(existing.map((s) => [s.name.toLowerCase(), s.id]));
    let lastRank = existing.map((s) => s.rank).sort().at(-1) ?? null;

    const wanted = [...new Set(v.rows.map((r) => r.sectionName?.trim()).filter((n): n is string => Boolean(n)))];
    if (v.createSections) {
      for (const name of wanted) {
        if (byName.has(name.toLowerCase())) continue;
        const [rank] = ranksAfter(lastRank, 1);
        lastRank = rank;
        let slug = slugify(name);
        const clash = await tx.select({ id: sections.id }).from(sections).where(eq(sections.slug, slug));
        if (clash.length) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
        const [row] = await tx
          .insert(sections)
          .values({ name, slug, rank, color: DYES[byName.size % DYES.length] })
          .returning({ id: sections.id });
        byName.set(name.toLowerCase(), row.id);
      }
    }

    const [imp] = await tx
      .insert(imports)
      .values({ filename: v.filename, kind: v.kind, taskCount: v.rows.length })
      .returning({ id: imports.id });
    const ranks = ranksAfter(null, v.rows.length);
    await tx.insert(tasks).values(
      v.rows.map((r, i) => ({
        title: r.title,
        notesMd: r.notes,
        sectionId: (r.sectionName && byName.get(r.sectionName.trim().toLowerCase())) || v.defaultSectionId,
        plannedDate: r.date,
        plannedStart: r.start,
        plannedMinutes: r.minutes,
        importId: imp.id,
        rank: ranks[i],
      })),
    );
    revalidatePath("/", "layout");
    return { id: imp.id, count: v.rows.length };
  });
}

/** Removes every task an import created (time already logged on them stays, unlinked). */
export async function undoImport(id: string) {
  z.uuid().parse(id);
  await db.delete(imports).where(eq(imports.id, id));
  revalidatePath("/", "layout");
}

export async function listImports() {
  return db
    .select({
      id: imports.id,
      filename: imports.filename,
      taskCount: imports.taskCount,
      createdAt: imports.createdAt,
      remaining: sql<number>`(select count(*)::int from tasks t where t.import_id = ${imports.id})`,
    })
    .from(imports)
    .orderBy(desc(imports.createdAt))
    .limit(30);
}
