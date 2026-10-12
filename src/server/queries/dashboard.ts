import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { shiftDay } from "@/lib/time";

export type SectionTotal = { id: string; name: string; slug: string; color: string; seconds: number };
export type TaskTotal = { id: string; title: string; color: string; sectionName: string; seconds: number };

export async function getSectionTotals(from: string, to: string): Promise<SectionTotal[]> {
  const rows = await db.execute<{ id: string; name: string; slug: string; color: string; seconds: string }>(sql`
    select s.id, s.name, s.slug, s.color, sum(v.seconds)::bigint as seconds
    from v_daily_section_seconds v join sections s on s.id = v.section_id
    where v.day between ${from}::date and ${to}::date
    group by s.id
    having sum(v.seconds) > 0
    order by seconds desc
  `);
  return rows.map((r) => ({ ...r, seconds: Number(r.seconds) }));
}

export async function getTaskTotals(from: string, to: string, limit = 8): Promise<TaskTotal[]> {
  const rows = await db.execute<{ id: string; title: string; color: string; section_name: string; seconds: string }>(sql`
    select t.id, t.title, s.color, s.name as section_name, sum(v.seconds)::bigint as seconds
    from v_daily_task_seconds v
    join tasks t on t.id = v.task_id
    join sections s on s.id = v.section_id
    where v.day between ${from}::date and ${to}::date
    group by t.id, s.color, s.name
    having sum(v.seconds) > 0
    order by seconds desc
    limit ${limit}
  `);
  return rows.map((r) => ({ id: r.id, title: r.title, color: r.color, sectionName: r.section_name, seconds: Number(r.seconds) }));
}

/** Logged seconds per day for a range, every day present (zeros included). */
export async function getDailySeries(from: string, to: string) {
  const rows = await db.execute<{ day: string; seconds: string }>(sql`
    select d::date::text as day, coalesce(sum(v.seconds), 0)::bigint as seconds
    from generate_series(${from}::date, ${to}::date, interval '1 day') d
    left join v_daily_section_seconds v on v.day = d::date
    group by d order by d
  `);
  return rows.map((r) => ({ day: r.day, seconds: Number(r.seconds) }));
}

export async function getPlannedByDay(from: string, to: string) {
  const rows = await db.execute<{ day: string; minutes: string; total: string; done: string }>(sql`
    select planned_date::text as day, coalesce(sum(planned_minutes), 0)::int as minutes,
      count(*)::int as total, count(*) filter (where status = 'done')::int as done
    from tasks where planned_date between ${from}::date and ${to}::date
    group by planned_date
  `);
  const out: Record<string, { minutes: number; total: number; done: number }> = {};
  for (const r of rows) out[r.day] = { minutes: Number(r.minutes), total: Number(r.total), done: Number(r.done) };
  return out;
}

/** Consecutive days with logged time, ending today (or yesterday if today is still empty). */
export async function getStreak(today: string) {
  const series = await getDailySeries(shiftDay(today, -365), today);
  const active = new Set(series.filter((d) => d.seconds > 0).map((d) => d.day));
  let cursor = active.has(today) ? today : shiftDay(today, -1);
  let current = 0;
  while (active.has(cursor)) {
    current++;
    cursor = shiftDay(cursor, -1);
  }
  let best = 0;
  let run = 0;
  for (const d of series) {
    run = d.seconds > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { current, best };
}

export type ProjectProgress = {
  id: string;
  name: string;
  unitLabel: string;
  targetUnits: number;
  dueDate: string | null;
  startDate: string | null;
  section: { id: string; name: string; slug: string; color: string };
  done: number;
  last7: number;
  last28: number;
  firstLog: string | null;
};

export async function getProjects(sectionId?: string): Promise<ProjectProgress[]> {
  const rows = await db.execute<{
    id: string;
    name: string;
    unit_label: string;
    target_units: string;
    due_date: string | null;
    start_date: string | null;
    section_id: string;
    section_name: string;
    section_slug: string;
    section_color: string;
    done: string;
    last7: string;
    last28: string;
    first_log: string | null;
  }>(sql`
    select p.id, p.name, p.unit_label, p.target_units::text, p.due_date::text, p.start_date::text,
      s.id as section_id, s.name as section_name, s.slug as section_slug, s.color as section_color,
      coalesce(sum(l.units), 0)::text as done,
      coalesce(sum(l.units) filter (where l.logged_at >= now() - interval '7 days'), 0)::text as last7,
      coalesce(sum(l.units) filter (where l.logged_at >= now() - interval '28 days'), 0)::text as last28,
      min(l.logged_at)::date::text as first_log
    from projects p
    join sections s on s.id = p.section_id
    left join progress_logs l on l.project_id = p.id
    where p.archived_at is null ${sectionId ? sql`and p.section_id = ${sectionId}` : sql``}
    group by p.id, s.id
    order by s.rank, p.created_at
  `);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    unitLabel: r.unit_label,
    targetUnits: Number(r.target_units),
    dueDate: r.due_date,
    startDate: r.start_date,
    section: { id: r.section_id, name: r.section_name, slug: r.section_slug, color: r.section_color },
    done: Number(r.done),
    last7: Number(r.last7),
    last28: Number(r.last28),
    firstLog: r.first_log,
  }));
}
