import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export type PlannerTask = {
  id: string;
  title: string;
  notesMd: string;
  status: "todo" | "doing" | "done";
  plannedDate: string | null;
  plannedStart: string | null;
  plannedMinutes: number | null;
  units: number | null;
  rank: string;
  projectId: string | null;
  scheduleId: string | null;
  section: { id: string; name: string; slug: string; color: string };
  loggedSeconds: number;
  docs: { id: string; title: string; slug: string }[];
};

type Row = {
  id: string;
  title: string;
  notes_md: string;
  status: PlannerTask["status"];
  planned_date: string | null;
  planned_start: string | null;
  planned_minutes: number | null;
  units: string | null;
  rank: string;
  project_id: string | null;
  schedule_id: string | null;
  section_id: string;
  section_name: string;
  section_slug: string;
  section_color: string;
  logged_seconds: string | null;
  docs: { id: string; title: string; slug: string }[] | null;
};

function shape(r: Row): PlannerTask {
  return {
    id: r.id,
    title: r.title,
    notesMd: r.notes_md,
    status: r.status,
    plannedDate: r.planned_date,
    plannedStart: r.planned_start ? r.planned_start.slice(0, 5) : null,
    plannedMinutes: r.planned_minutes,
    units: r.units === null ? null : Number(r.units),
    rank: r.rank,
    projectId: r.project_id,
    scheduleId: r.schedule_id,
    section: { id: r.section_id, name: r.section_name, slug: r.section_slug, color: r.section_color },
    loggedSeconds: Number(r.logged_seconds ?? 0),
    docs: r.docs ?? [],
  };
}

const SELECT = sql`
  select
    t.id, t.title, t.notes_md, t.status, t.planned_date::text, t.planned_start::text,
    t.planned_minutes, t.units::text, t.rank, t.project_id, t.schedule_id,
    s.id as section_id, s.name as section_name, s.slug as section_slug, s.color as section_color,
    (select sum(extract(epoch from (coalesce(te.ended_at, now()) - te.started_at)))::bigint
       from time_entries te where te.task_id = t.id) as logged_seconds,
    (select json_agg(json_build_object('id', d.id, 'title', d.title, 'slug', s.slug) order by d.title)
       from document_tasks dt join documents d on d.id = dt.document_id
       where dt.task_id = t.id) as docs
  from tasks t
  join sections s on s.id = t.section_id
`;

export async function getTasksInRange(from: string, to: string) {
  const rows = await db.execute<Row>(sql`
    ${SELECT}
    where t.planned_date between ${from}::date and ${to}::date
    order by t.planned_date, t.planned_start nulls last, t.rank
  `);
  return rows.map(shape);
}

export async function getBacklog(sectionId: string) {
  const rows = await db.execute<Row>(sql`
    ${SELECT}
    where t.section_id = ${sectionId} and t.planned_date is null
    order by t.status = 'done', t.rank
  `);
  return rows.map(shape);
}

export async function getSectionUpcoming(sectionId: string, from: string) {
  const rows = await db.execute<Row>(sql`
    ${SELECT}
    where t.section_id = ${sectionId} and t.planned_date >= ${from}::date
    order by t.planned_date, t.planned_start nulls last, t.rank
    limit 50
  `);
  return rows.map(shape);
}
