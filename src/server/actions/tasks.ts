"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { documents, documentSections, progressLogs, tasks } from "@/db/schema";
import { rankBetween } from "@/lib/rank";
import { requireUserId } from "@/server/auth";
import { ownProjects, ownSections } from "@/server/own";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);

const createSchema = z.object({
  title: z.string().trim().min(1).max(300),
  sectionId: z.uuid(),
  plannedDate: day.nullable().optional(),
  plannedStart: clock.nullable().optional(),
  plannedMinutes: z.number().int().min(1).max(24 * 60).nullable().optional(),
  projectId: z.uuid().nullable().optional(),
  units: z.number().positive().max(1_000_000).nullable().optional(),
});

const patchSchema = createSchema.partial().extend({
  notesMd: z.string().max(200_000).optional(),
});

export type TaskPatch = z.infer<typeof patchSchema>;

async function lastRank(userId: string, sectionId: string, plannedDate: string | null) {
  const [row] = await db
    .select({ rank: tasks.rank })
    .from(tasks)
    .where(
      plannedDate
        ? and(eq(tasks.userId, userId), eq(tasks.plannedDate, plannedDate))
        : and(eq(tasks.userId, userId), eq(tasks.sectionId, sectionId), isNull(tasks.plannedDate)),
    )
    .orderBy(desc(tasks.rank))
    .limit(1);
  return row?.rank ?? null;
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function createTask(input: z.input<typeof createSchema>) {
  const userId = await requireUserId();
  const v = createSchema.parse(input);
  await ownSections(userId, v.sectionId);
  if (v.projectId) await ownProjects(userId, v.projectId);
  const [row] = await db
    .insert(tasks)
    .values({
      userId,
      title: v.title,
      sectionId: v.sectionId,
      plannedDate: v.plannedDate ?? null,
      plannedStart: v.plannedStart ?? null,
      plannedMinutes: v.plannedMinutes ?? null,
      projectId: v.projectId ?? null,
      units: v.units ?? null,
      rank: rankBetween(await lastRank(userId, v.sectionId, v.plannedDate ?? null), null),
    })
    .returning({ id: tasks.id });
  refresh();
  return row.id;
}

export async function updateTask(id: string, patch: TaskPatch) {
  const userId = await requireUserId();
  z.uuid().parse(id);
  const v = patchSchema.parse(patch);
  if (v.sectionId) await ownSections(userId, v.sectionId);
  if (v.projectId) await ownProjects(userId, v.projectId);
  const values: Partial<typeof tasks.$inferInsert> = { ...v };
  // Editing the date or time of a scheduled occurrence detaches it from its rule.
  if (v.plannedDate !== undefined || v.plannedStart !== undefined || v.plannedMinutes !== undefined) {
    values.isDetached = true;
  }
  if (v.plannedDate !== undefined) {
    const [current] = await db
      .select({ sectionId: tasks.sectionId })
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    if (current)
      values.rank = rankBetween(await lastRank(userId, v.sectionId ?? current.sectionId, v.plannedDate ?? null), null);
  }
  await db
    .update(tasks)
    .set(values)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  await syncProgress(userId, id);
  refresh();
}

export async function setTaskStatus(id: string, status: "todo" | "doing" | "done") {
  const userId = await requireUserId();
  z.uuid().parse(id);
  z.enum(["todo", "doing", "done"]).parse(status);
  await db
    .update(tasks)
    .set({ status, completedAt: status === "done" ? new Date() : null })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  await syncProgress(userId, id);
  refresh();
}

/** Keeps the task's progress log in line with its completion, project and units. */
async function syncProgress(userId: string, taskId: string) {
  const [t] = await db
    .select({ status: tasks.status, projectId: tasks.projectId, units: tasks.units, completedAt: tasks.completedAt })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
  if (!t) return;
  if (t.status === "done" && t.projectId && t.units) {
    await db
      .insert(progressLogs)
      .values({ userId, projectId: t.projectId, taskId, units: t.units, loggedAt: t.completedAt ?? new Date() })
      .onConflictDoUpdate({
        target: progressLogs.taskId,
        set: { projectId: t.projectId, units: t.units },
      });
  } else {
    await db.delete(progressLogs).where(eq(progressLogs.taskId, taskId));
  }
}

export async function deleteTask(id: string) {
  const userId = await requireUserId();
  await db.delete(tasks).where(and(eq(tasks.id, z.uuid().parse(id)), eq(tasks.userId, userId)));
  refresh();
}

/** Moves a task between two neighbours on the same list. */
export async function reorderTask(id: string, before: string | null, after: string | null) {
  const userId = await requireUserId();
  z.uuid().parse(id);
  let a = before, b = after;
  if (a && b && a >= b) [a, b] = [b, a];
  await db
    .update(tasks)
    .set({ rank: rankBetween(a, b) })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  refresh();
}

export async function listSectionDocuments(sectionId: string) {
  const userId = await requireUserId();
  z.uuid().parse(sectionId);
  return db
    .select({ id: documents.id, title: documents.title })
    .from(documents)
    .innerJoin(documentSections, eq(documentSections.documentId, documents.id))
    .where(and(eq(documents.userId, userId), eq(documentSections.sectionId, sectionId)))
    .orderBy(desc(documents.updatedAt))
    .limit(100);
}
