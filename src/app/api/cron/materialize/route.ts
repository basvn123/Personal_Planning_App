import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { localDate, shiftDay } from "@/lib/time";
import { HORIZON_DAYS, materializeSchedules } from "@/server/materialize";

/** Daily Vercel Cron: keeps every account's schedules generated eight weeks ahead. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accounts = await db.select({ userId: settings.userId, timezone: settings.timezone }).from(settings);
  for (const a of accounts) {
    const today = localDate(new Date(), a.timezone);
    await materializeSchedules(a.userId, today, shiftDay(today, HORIZON_DAYS));
  }
  return NextResponse.json({ ok: true, accounts: accounts.length });
}
