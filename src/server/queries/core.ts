import "server-only";
import { asc, eq, isNull, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db/client";
import { sections, settings, timeEntries } from "@/db/schema";
import { DEFAULT_TZ } from "@/lib/time";

export const getSettings = cache(async () => {
  const [row] = await db.select().from(settings).where(eq(settings.id, 1));
  return row ?? { id: 1, timezone: DEFAULT_TZ, weekStart: 1, icsToken: "", updatedAt: new Date() };
});

export const getSections = cache(async () => {
  return db
    .select()
    .from(sections)
    .where(isNull(sections.archivedAt))
    .orderBy(asc(sections.rank));
});

export const getRunningEntry = cache(async () => {
  const [row] = await db.select().from(timeEntries).where(isNull(timeEntries.endedAt));
  return row ?? null;
});

/** Seconds logged per local day between two local dates (inclusive). */
export async function getDailyTotals(from: string, to: string) {
  const rows = await db.execute<{ day: string; seconds: string }>(sql`
    select day::text as day, sum(seconds)::bigint as seconds
    from v_daily_section_seconds
    where day between ${from}::date and ${to}::date
    group by day
  `);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.day] = Number(r.seconds);
  return out;
}
