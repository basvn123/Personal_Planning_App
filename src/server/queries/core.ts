import "server-only";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db/client";
import { sections, settings } from "@/db/schema";
import { DEFAULT_TZ } from "@/lib/time";
import { requireUserId } from "@/server/auth";

export const getSettings = cache(async () => {
  const userId = await requireUserId();
  const [row] = await db.select().from(settings).where(eq(settings.userId, userId));
  if (row) return row;
  // Accounts get their settings row on creation; this covers anything older.
  const [created] = await db.insert(settings).values({ userId }).onConflictDoNothing().returning();
  return created ?? { userId, timezone: DEFAULT_TZ, weekStart: 1, icsToken: "", updatedAt: new Date() };
});

export const getSections = cache(async () => {
  const userId = await requireUserId();
  return db
    .select()
    .from(sections)
    .where(and(eq(sections.userId, userId), isNull(sections.archivedAt)))
    .orderBy(asc(sections.rank));
});

/** Seconds logged per local day between two local dates (inclusive). */
export async function getDailyTotals(from: string, to: string) {
  const userId = await requireUserId();
  const rows = await db.execute<{ day: string; seconds: string }>(sql`
    select day::text as day, sum(seconds)::bigint as seconds
    from v_daily_section_seconds
    where user_id = ${userId} and day between ${from}::date and ${to}::date
    group by day
  `);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.day] = Number(r.seconds);
  return out;
}

/** Recent documents for the command palette, each with one section to open it in. */
export const getDocIndex = cache(async () => {
  const userId = await requireUserId();
  const rows = await db.execute<{ id: string; title: string; slug: string }>(sql`
    select distinct on (d.id) d.id, d.title, s.slug
    from documents d
    join document_sections ds on ds.document_id = d.id
    join sections s on s.id = ds.section_id
    where d.user_id = ${userId}
    order by d.id, s.archived_at nulls first
  `);
  return [...rows];
});

export const getProjectOptions = cache(async () => {
  const userId = await requireUserId();
  const rows = await db.execute<{ id: string; name: string; section_id: string; unit_label: string }>(sql`
    select id, name, section_id, unit_label from projects
    where user_id = ${userId} and archived_at is null order by name
  `);
  return rows.map((r) => ({ id: r.id, name: r.name, sectionId: r.section_id, unitLabel: r.unit_label }));
});
