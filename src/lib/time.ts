import { TZDate } from "@date-fns/tz";
import { addDays, format, startOfWeek } from "date-fns";
import { nl } from "date-fns/locale";

export const DEFAULT_TZ = "Europe/Brussels";

/** Local calendar date (YYYY-MM-DD) for an instant in a timezone. */
export function localDate(instant: Date, tz: string): string {
  return format(new TZDate(instant, tz), "yyyy-MM-dd");
}

/** Parses YYYY-MM-DD as a plain calendar date (noon UTC avoids DST edges). */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function formatDay(day: string, pattern: string): string {
  const date = parseDay(day);
  return format(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()), pattern, { locale: nl });
}

export function shiftDay(day: string, days: number): string {
  const d = parseDay(day);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The 7 calendar days of the week containing `day`. weekStart: 0 = Sunday, 1 = Monday. */
export function weekDays(day: string, weekStart: 0 | 1 = 1): string[] {
  const d = parseDay(day);
  const local = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const start = startOfWeek(local, { weekStartsOn: weekStart });
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
}

export function isoWeekNumber(day: string): number {
  return Number(formatDay(day, "I"));
}

/** 5400 -> "1:30". Hours are unbounded, minutes padded. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

/** Timer readout with seconds: 3725 -> "1:02:05". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** 45 -> "45m", 60 -> "1h", 90 -> "1h30". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** "09:30" (or "09:30:00") -> 570, minutes since midnight. */
export function clockToMinutes(clock: string): number {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
}

/** 570 -> "09:30". Wraps past midnight, so 1470 -> "00:30". */
export function minutesToClock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** The end of a block that starts at `start` and lasts `minutes`: ("09:30", 90) -> "11:00". */
export function endClock(start: string, minutes: number): string {
  return minutesToClock(clockToMinutes(start) + minutes);
}

/** The first day of `day`'s month, moved `months` months (YYYY-MM-01). */
export function shiftMonth(day: string, months: number): string {
  const [y, m] = day.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
}

/** Six full weeks covering `day`'s month, as a calendar shows them. */
export function monthGrid(day: string, weekStart: 0 | 1 = 1): string[] {
  const first = shiftMonth(day, 0);
  const start = weekDays(first, weekStart)[0];
  return Array.from({ length: 42 }, (_, i) => shiftDay(start, i));
}
