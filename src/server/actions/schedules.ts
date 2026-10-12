"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { schedules } from "@/db/schema";
import { buildRule, WEEKDAY_CODES } from "@/lib/recurrence";
import { localDate, shiftDay } from "@/lib/time";
import { clearFutureOccurrences, HORIZON_DAYS, materializeSchedules } from "@/server/materialize";
import { getSettings } from "@/server/queries/core";

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

async function regenerate(id: string) {
  const t = await today();
  await clearFutureOccurrences(id, t);
  await db.update(schedules).set({ materializedUntil: shiftDay(t, -1) }).where(eq(schedules.id, id));
  await materializeSchedules(t, shiftDay(t, HORIZON_DAYS));
  revalidatePath("/", "layout");
}

export async function createSchedule(input: ScheduleInput) {
  const v = scheduleSchema.parse(input);
  const [row] = await db
    .insert(schedules)
    .values({
      title: v.title,
      sectionId: v.sectionId,
      projectId: v.projectId ?? null,
      rrule: buildRule({ start: v.start, until: v.until, interval: v.interval, days: v.days }),
      startTime: v.startTime,
      durationMinutes: v.durationMinutes,
      units: v.units ?? null,
    })
    .returning({ id: schedules.id });
  await regenerate(row.id);
}

export async function updateSchedule(id: string, input: ScheduleInput) {
  z.uuid().parse(id);
  const v = scheduleSchema.parse(input);
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
    .where(eq(schedules.id, id));
  await regenerate(id);
}

export async function setScheduleActive(id: string, active: boolean) {
  z.uuid().parse(id);
  await db.update(schedules).set({ active }).where(eq(schedules.id, id));
  if (active) await regenerate(id);
  else {
    await clearFutureOccurrences(id, await today());
    revalidatePath("/", "layout");
  }
}

export async function deleteSchedule(id: string) {
  z.uuid().parse(id);
  await clearFutureOccurrences(id, await today());
  await db.delete(schedules).where(eq(schedules.id, id));
  revalidatePath("/", "layout");
}
