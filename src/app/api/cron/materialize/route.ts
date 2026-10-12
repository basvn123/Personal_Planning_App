import { NextResponse } from "next/server";
import { localDate, shiftDay } from "@/lib/time";
import { HORIZON_DAYS, materializeSchedules } from "@/server/materialize";
import { getSettings } from "@/server/queries/core";

/** Daily Vercel Cron: keeps schedules generated eight weeks ahead. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { timezone } = await getSettings();
  const today = localDate(new Date(), timezone);
  await materializeSchedules(today, shiftDay(today, HORIZON_DAYS));
  return NextResponse.json({ ok: true });
}
