import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { requireUserId } from "@/server/auth";

export type SectionSummary = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  color: string;
  openTodos: number;
  planned: number;
  docs: number;
  files: number;
  weekSeconds: number;
};

/** One row per active section with the counts the overview page shows. */
export async function getSectionSummaries(weekFrom: string, weekTo: string, today: string): Promise<SectionSummary[]> {
  const userId = await requireUserId();
  const rows = await db.execute<{
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    color: string;
    open_todos: number;
    planned: number;
    docs: number;
    files: number;
    week_seconds: string;
  }>(sql`
    select s.id, s.parent_id, s.name, s.slug, s.color,
      (select count(*)::int from tasks t where t.section_id = s.id and t.planned_date is null and t.status <> 'done') as open_todos,
      (select count(*)::int from tasks t where t.section_id = s.id and t.planned_date >= ${today}::date and t.status <> 'done') as planned,
      (select count(*)::int from document_sections ds where ds.section_id = s.id) as docs,
      (select count(*)::int from files f where f.section_id = s.id) as files,
      coalesce((select sum(v.seconds) from v_daily_section_seconds v
        where v.section_id = s.id and v.day between ${weekFrom}::date and ${weekTo}::date), 0)::bigint as week_seconds
    from sections s
    where s.user_id = ${userId} and s.archived_at is null
    order by s.rank
  `);
  return rows.map((r) => ({
    id: r.id,
    parentId: r.parent_id,
    name: r.name,
    slug: r.slug,
    color: r.color,
    openTodos: Number(r.open_todos),
    planned: Number(r.planned),
    docs: Number(r.docs),
    files: Number(r.files),
    weekSeconds: Number(r.week_seconds),
  }));
}

export type LibraryItem = {
  kind: "doc" | "file";
  id: string;
  title: string;
  updatedAt: Date;
  section: { name: string; slug: string; color: string };
  contentType?: string;
  size?: number;
};

/** Most recent documents and uploaded files across every section. */
export async function getRecentLibrary(limit = 30): Promise<LibraryItem[]> {
  const userId = await requireUserId();
  const rows = await db.execute<{
    kind: "doc" | "file";
    id: string;
    title: string;
    updated_at: Date;
    section_name: string;
    section_slug: string;
    section_color: string;
    content_type: string | null;
    size: number | null;
  }>(sql`
    (select distinct on (d.id) 'doc' as kind, d.id, d.title, d.updated_at,
        s.name as section_name, s.slug as section_slug, s.color as section_color,
        null::text as content_type, null::int as size
      from documents d
      join document_sections ds on ds.document_id = d.id
      join sections s on s.id = ds.section_id
      where d.user_id = ${userId}
      order by d.id, s.archived_at nulls first)
    union all
    (select 'file', f.id, f.name, f.created_at, s.name, s.slug, s.color, f.content_type, f.size
      from files f join sections s on s.id = f.section_id
      where f.user_id = ${userId})
    order by updated_at desc
    limit ${limit}
  `);
  return rows.map((r) => ({
    kind: r.kind,
    id: r.id,
    title: r.title,
    updatedAt: new Date(r.updated_at),
    section: { name: r.section_name, slug: r.section_slug, color: r.section_color },
    contentType: r.content_type ?? undefined,
    size: r.size ?? undefined,
  }));
}
