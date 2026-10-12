"use server";

import { eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { tasks, timeEntries } from "@/db/schema";
import { zonedInstant } from "@/lib/zoned";
import { getSettings } from "@/server/queries/core";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

function refresh() {
  revalidatePath("/", "layout");
}

/** Starts a timer on a task (or a bare section). Any running timer stops first. */
export async function startTimer(input: { taskId?: string; sectionId?: string }) {
  const taskId = input.taskId ? z.uuid().parse(input.taskId) : null;
  let sectionId = input.sectionId ? z.uuid().parse(input.sectionId) : null;
  const now = new Date();
  await db.transaction(async (tx) => {
    if (taskId) {
      const [t] = await tx.select({ sectionId: tasks.sectionId, status: tasks.status }).from(tasks).where(eq(tasks.id, taskId));
      if (!t) throw new Error("Task not found");
      sectionId = t.sectionId;
      if (t.status === "todo") await tx.update(tasks).set({ status: "doing" }).where(eq(tasks.id, taskId));
    }
    if (!sectionId) throw new Error("A timer needs a task or a section");
    await tx.update(timeEntries).set({ endedAt: now }).where(isNull(timeEntries.endedAt));
    await tx.insert(timeEntries).values({ taskId, sectionId, startedAt: now, source: "timer" });
  });
  refresh();
}

export async function stopTimer() {
  await db.update(timeEntries).set({ endedAt: new Date() }).where(isNull(timeEntries.endedAt));
  refresh();
}

const manualSchema = z
  .object({
    taskId: z.uuid().nullable().optional(),
    sectionId: z.uuid().nullable().optional(),
    day,
    start: clock,
    end: clock,
    note: z.string().max(500).optional(),
  })
  .refine((v) => v.taskId || v.sectionId, "A task or section is required");

/** Retroactive entry. An end time before the start rolls over to the next day. */
export async function addManualEntry(input: z.input<typeof manualSchema>) {
  const v = manualSchema.parse(input);
  const { timezone } = await getSettings();
  const startedAt = zonedInstant(v.day, v.start, timezone);
  let endedAt = zonedInstant(v.day, v.end, timezone);
  if (endedAt <= startedAt) endedAt = new Date(endedAt.getTime() + 24 * 3600 * 1000);
  let sectionId = v.sectionId ?? null;
  if (v.taskId) {
    const [t] = await db.select({ sectionId: tasks.sectionId }).from(tasks).where(eq(tasks.id, v.taskId));
    if (!t) throw new Error("Task not found");
    sectionId = t.sectionId;
  }
  await db.insert(timeEntries).values({
    taskId: v.taskId ?? null,
    sectionId: sectionId!,
    startedAt,
    endedAt,
    note: v.note || null,
    source: "manual",
  });
  refresh();
}

export async function updateEntry(id: string, input: { day: string; start: string; end: string | null }) {
  z.uuid().parse(id);
  const v = z.object({ day, start: clock, end: clock.nullable() }).parse(input);
  const { timezone } = await getSettings();
  const startedAt = zonedInstant(v.day, v.start, timezone);
  let endedAt: Date | null = null;
  if (v.end) {
    endedAt = zonedInstant(v.day, v.end, timezone);
    if (endedAt <= startedAt) endedAt = new Date(endedAt.getTime() + 24 * 3600 * 1000);
  }
  const [current] = await db.select({ endedAt: timeEntries.endedAt }).from(timeEntries).where(eq(timeEntries.id, id));
  if (!current) throw new Error("Entry not found");
  // A running entry stays running unless an end is given.
  await db
    .update(timeEntries)
    .set({ startedAt, ...(current.endedAt || endedAt ? { endedAt: endedAt ?? current.endedAt } : {}) })
    .where(eq(timeEntries.id, id));
  refresh();
}

export async function deleteEntry(id: string) {
  await db.delete(timeEntries).where(eq(timeEntries.id, z.uuid().parse(id)));
  refresh();
}
