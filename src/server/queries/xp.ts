import "server-only";
import { sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db/client";
import { requireUserId } from "@/server/auth";
import { getSettings } from "@/server/queries/core";
import { getStreak } from "@/server/queries/dashboard";
import { localDate } from "@/lib/time";
import { streakBonus, xpFrom } from "@/lib/xp";

export type XpSummary = { total: number; today: number; week: number; streak: number };

/** All points earned so far, plus today's and the last seven days' share. */
export const getXp = cache(async (): Promise<XpSummary> => {
  const userId = await requireUserId();
  const { timezone } = await getSettings();
  const today = localDate(new Date(), timezone);
  const [row] = await db.execute<{
    done_all: number;
    done_today: number;
    done_week: number;
    sec_all: string;
    sec_today: string;
    sec_week: string;
  }>(sql`
    with t as (
      select (completed_at at time zone ${timezone})::date as day
      from tasks where user_id = ${userId} and status = 'done' and completed_at is not null
    ), e as (
      select (started_at at time zone ${timezone})::date as day,
        extract(epoch from (coalesce(ended_at, now()) - started_at))::bigint as seconds
      from time_entries where user_id = ${userId}
    )
    select
      (select count(*) from t)::int as done_all,
      (select count(*) from t where day = ${today}::date)::int as done_today,
      (select count(*) from t where day > ${today}::date - 7)::int as done_week,
      (select coalesce(sum(seconds), 0) from e)::bigint as sec_all,
      (select coalesce(sum(seconds), 0) from e where day = ${today}::date)::bigint as sec_today,
      (select coalesce(sum(seconds), 0) from e where day > ${today}::date - 7)::bigint as sec_week
  `);
  const { current } = await getStreak(today);
  const all = xpFrom({ tasksDone: Number(row?.done_all ?? 0), secondsLogged: Number(row?.sec_all ?? 0) });
  return {
    total: all + streakBonus(current),
    today: xpFrom({ tasksDone: Number(row?.done_today ?? 0), secondsLogged: Number(row?.sec_today ?? 0) }),
    week: xpFrom({ tasksDone: Number(row?.done_week ?? 0), secondsLogged: Number(row?.sec_week ?? 0) }),
    streak: current,
  };
});
