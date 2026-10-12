import "server-only";
import { and, eq, gte, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { schedules, tasks } from "@/db/schema";
import { occurrences } from "@/lib/recurrence";
import { ranksAfter } from "@/lib/rank";
import { shiftDay } from "@/lib/time";

export const HORIZON_DAYS = 56;

/**
 * Turns schedule rules into real tasks up to `until`. Each schedule keeps a
 * watermark (materialized_until), so dates already generated are never
 * generated again: a deleted occurrence stays deleted.
 */
export async function materializeSchedules(userId: string, today: string, until: string) {
  const due = await db
    .select()
    .from(schedules)
    .where(
      and(
        eq(schedules.userId, userId),
        eq(schedules.active, true),
        or(isNull(schedules.materializedUntil), lt(schedules.materializedUntil, until)),
      ),
    );

  for (const s of due) {
    const from = s.materializedUntil ? shiftDay(s.materializedUntil, 1) : today;
    const dates = occurrences(s.rrule, from < today ? today : from, until);
    if (dates.length) {
      const ranks = ranksAfter(null, dates.length);
      await db
        .insert(tasks)
        .values(
          dates.map((date, i) => ({
            userId: s.userId,
            title: s.title,
            sectionId: s.sectionId,
            projectId: s.projectId,
            plannedDate: date,
            plannedStart: s.startTime,
            plannedMinutes: s.durationMinutes,
            units: s.units,
            scheduleId: s.id,
            occurrenceDate: date,
            rank: ranks[i],
          })),
        )
        .onConflictDoNothing();
    }
    await db.update(schedules).set({ materializedUntil: until }).where(eq(schedules.id, s.id));
  }
}

/**
 * Removes upcoming, untouched occurrences so a changed rule can regenerate them.
 * With `includeEdited` (deleting the whole schedule) moved or retimed ones go too;
 * started and finished ones always stay.
 */
export async function clearFutureOccurrences(scheduleId: string, today: string, includeEdited = false) {
  await db
    .delete(tasks)
    .where(
      and(
        eq(tasks.scheduleId, scheduleId),
        gte(tasks.plannedDate, today),
        includeEdited ? undefined : eq(tasks.isDetached, false),
        eq(tasks.status, "todo"),
        sql`not exists (select 1 from time_entries te where te.task_id = ${tasks.id})`,
      ),
    );
}
