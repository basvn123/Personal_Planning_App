import { TZDate } from "@date-fns/tz";

/** Converts a local calendar date and "HH:MM" in a timezone to an instant. */
export function zonedInstant(day: string, hhmm: string, tz: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, h, mi, 0, tz).getTime());
}

/** "HH:MM" of an instant in a timezone. */
export function zonedClock(instant: Date, tz: string): string {
  const z = new TZDate(instant, tz);
  return `${String(z.getHours()).padStart(2, "0")}:${String(z.getMinutes()).padStart(2, "0")}`;
}
