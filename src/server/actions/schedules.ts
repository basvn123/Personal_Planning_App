"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { schedules } from "@/db/schema";
import { buildRule, WEEKDAY_CODES } from "@/lib/recurrence";
import { localDate, shiftDay } from "@/lib/time";
import { clearFutureOccurrences, HORIZON_DAYS, materializeSchedules } from "@/server/materialize";
import { getSettings } from "@/server/queries/core";
import { requireUserId } from "@/server/auth";
import { ownProjects, ownSchedules, ownSections } from "@/server/own";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const scheduleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  sectionId: z.uuid(),
  projectId: z.uuid().nullable().optional(),
  days: z.array(z.enum(WEEKDAY_CODES)).min(1),
  interval: z.number().int().min(1).max(8),
  start: day,
  until: day.nullable(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.number().int().min(5).max(24 * 60),
  units: z.number().positive().nullable().optional(),
});

export type ScheduleInput = z.input<typeof scheduleSchema>;

async function today() {
  const { timezone } = await getSettings();
  return localDate(new Date(), timezone);
}

async function regenerate(userId: string, id: string) {
  const t = await today();
  await clearFutureOccurrences(id, t);
  await db
    .update(schedules)
    .set({ materializedUntil: shiftDay(t, -1) })
    .where(and(eq(schedules.id, id), eq(schedules.userId, userId)));
  await materializeSchedules(userId, t, shiftDay(t, HORIZON_DAYS));
  revalidatePath("/", "layout");
}

async function checkRefs(userId: string, v: z.infer<typeof scheduleSchema>) {
  await ownSections(userId, v.sectionId);
  if (v.projectId) await ownProjects(userId, v.projectId);
}

export async function createSchedule(input: ScheduleInput) {
  const userId = await requireUserId();
  const v = scheduleSchema.parse(input);
  await checkRefs(userId, v);
  const [row] = await db
    .insert(schedules)
    .values({
      userId,
      title: v.title,
      sectionId: v.sectionId,
      projectId: v.projectId ?? null,
      rrule: buildRule({ start: v.start, until: v.until, interval: v.interval, days: v.days }),
      startTime: v.startTime,
      durationMinutes: v.durationMinutes,
      units: v.units ?? null,
    })
    .returning({ id: schedules.id });
  await regenerate(userId, row.id);
}

export async function updateSchedule(id: string, input: ScheduleInput) {
  const userId = await requireUserId();
  z.uuid().parse(id);
  await ownSchedules(userId, id);
  const v = scheduleSchema.parse(input);
  await checkRefs(userId, v);
  await db
    .update(schedules)
    .set({
      title: v.title,
      sectionId: v.sectionId,
      projectId: v.projectId ?? null,
      rrule: buildRule({ start: v.start, until: v.until, interval: v.interval, days: v.days }),
      startTime: v.startTime,
      durationMinutes: v.durationMinutes,
      units: v.units ?? null,
    })
    .where(and(eq(schedules.id, id), eq(schedules.userId, userId)));
  await regenerate(userId, id);
}

export async function setScheduleActive(id: string, active: boolean) {
  const userId = await requireUserId();
  z.uuid().parse(id);
  await ownSchedules(userId, id);
  await db.update(schedules).set({ active }).where(eq(schedules.id, id));
  if (active) await regenerate(userId, id);
  else {
    await clearFutureOccurrences(id, await today());
    revalidatePath("/", "layout");
  }
}

export async function deleteSchedule(id: string) {
  const userId = await requireUserId();
  z.uuid().parse(id);
  await ownSchedules(userId, id);
  await clearFutureOccurrences(id, await today());
  await db.delete(schedules).where(eq(schedules.id, id));
  revalidatePath("/", "layout");
}
