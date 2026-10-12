import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { requireUserId } from "@/server/auth";

export type LogEntry = {
  id: string;
  day: string;
  startedAt: string;
  endedAt: string | null;
  startClock: string;
  endClock: string | null;
  seconds: number;
  source: "timer" | "manual" | "import";
  note: string | null;
  task: { id: string; title: string } | null;
  section: { id: string; name: string; color: string };
};

export type RunningTimer = {
  id: string;
  startedAt: string;
  task: { id: string; title: string } | null;
  section: { id: string; name: string; slug: string; color: string };
};

export async function getRunningTimer(): Promise<RunningTimer | null> {
  const userId = await requireUserId();
  const rows = await db.execute<{
    id: string;
    started_at: Date;
    task_id: string | null;
    task_title: string | null;
    section_id: string;
    section_name: string;
    section_slug: string;
    section_color: string;
  }>(sql`
    select te.id, te.started_at, t.id as task_id, t.title as task_title,
      s.id as section_id, s.name as section_name, s.slug as section_slug, s.color as section_color
    from time_entries te
    join sections s on s.id = te.section_id
    left join tasks t on t.id = te.task_id
    where te.user_id = ${userId} and te.ended_at is null
    limit 1
  `);
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    startedAt: new Date(r.started_at).toISOString(),
    task: r.task_id ? { id: r.task_id, title: r.task_title! } : null,
    section: { id: r.section_id, name: r.section_name, slug: r.section_slug, color: r.section_color },
  };
}

export async function getEntriesInRange(from: string, to: string): Promise<LogEntry[]> {
  const userId = await requireUserId();
  const rows = await db.execute<{
    id: string;
    day: string;
    started_at: Date;
    ended_at: Date | null;
    seconds: string;
    start_clock: string;
    end_clock: string | null;
    source: LogEntry["source"];
    note: string | null;
    task_id: string | null;
    task_title: string | null;
    section_id: string;
    section_name: string;
    section_color: string;
  }>(sql`
    select v.id, v.day::text as day, v.started_at, v.ended_at, v.seconds, te.source, te.note,
      to_char(v.started_at at time zone st.timezone, 'HH24:MI') as start_clock,
      to_char(v.ended_at at time zone st.timezone, 'HH24:MI') as end_clock,
      t.id as task_id, t.title as task_title, s.id as section_id, s.name as section_name, s.color as section_color
    from v_time_entries_local v
    join time_entries te on te.id = v.id
    join sections s on s.id = v.section_id
    left join tasks t on t.id = v.task_id
    join settings st on st.user_id = v.user_id
    where v.user_id = ${userId} and v.day between ${from}::date and ${to}::date
    order by v.started_at
  `);
  return rows.map((r) => ({
    id: r.id,
    day: r.day,
    startedAt: new Date(r.started_at).toISOString(),
    endedAt: r.ended_at ? new Date(r.ended_at).toISOString() : null,
    startClock: r.start_clock,
    endClock: r.end_clock,
    seconds: Number(r.seconds),
    source: r.source,
    note: r.note,
    task: r.task_id ? { id: r.task_id, title: r.task_title! } : null,
    section: { id: r.section_id, name: r.section_name, color: r.section_color },
  }));
}
