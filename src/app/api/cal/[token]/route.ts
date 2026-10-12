import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { buildCalendar } from "@/lib/ics";
import { localDate, shiftDay } from "@/lib/time";
import { getSettings } from "@/server/queries/core";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Calendar feed, authorised by the secret token in the URL so phone
 * calendars can subscribe. ?from=&to= narrows it; ?download=1 saves a file.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const settings = await getSettings();
  const clean = token.replace(/\.ics$/, "");
  if (!settings.icsToken || clean !== settings.icsToken) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const today = localDate(new Date(), settings.timezone);
  const from = DAY_RE.test(url.searchParams.get("from") ?? "") ? url.searchParams.get("from")! : shiftDay(today, -30);
  const to = DAY_RE.test(url.searchParams.get("to") ?? "") ? url.searchParams.get("to")! : shiftDay(today, 120);

  const rows = await db.execute<{
    id: string;
    title: string;
    notes_md: string;
    status: string;
    planned_date: string;
    planned_start: string | null;
    planned_minutes: number | null;
    updated_at: Date;
    section_name: string;
  }>(sql`
    select t.id, t.title, t.notes_md, t.status, t.planned_date::text, t.planned_start::text,
      t.planned_minutes, t.updated_at, s.name as section_name
    from tasks t join sections s on s.id = t.section_id
    where t.planned_date between ${from}::date and ${to}::date
    order by t.planned_date, t.planned_start nulls last
  `);

  const body = buildCalendar(
    rows.map((r) => ({
      uid: `${r.id}@planner`,
      title: r.title,
      description: r.notes_md || undefined,
      categories: r.section_name,
      date: r.planned_date,
      start: r.planned_start,
      minutes: r.planned_minutes,
      done: r.status === "done",
      updated: new Date(r.updated_at),
    })),
    settings.timezone,
    "Planner",
  );

  const download = url.searchParams.get("download") === "1";
  return new NextResponse(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "cache-control": "private, max-age=300",
      ...(download && { "content-disposition": `attachment; filename="planner-${from}-to-${to}.ics"` }),
    },
  });
}
