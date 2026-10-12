import { RRule } from "rrule";

export const WEEKDAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
export type WeekdayCode = (typeof WEEKDAY_CODES)[number];

export type Recurrence = {
  start: string; // YYYY-MM-DD
  until: string | null;
  interval: number; // weeks
  days: WeekdayCode[];
};

const compact = (day: string) => day.replace(/-/g, "");

export function buildRule(r: Recurrence): string {
  const parts = [`FREQ=WEEKLY`, `INTERVAL=${Math.max(1, r.interval)}`, `BYDAY=${r.days.join(",")}`, `WKST=MO`];
  if (r.until) parts.push(`UNTIL=${compact(r.until)}T235959Z`);
  return `DTSTART:${compact(r.start)}T000000Z\nRRULE:${parts.join(";")}`;
}

export function parseRule(rule: string): Recurrence {
  const start = rule.match(/DTSTART:(\d{4})(\d{2})(\d{2})/);
  const interval = rule.match(/INTERVAL=(\d+)/);
  const days = rule.match(/BYDAY=([A-Z,]+)/);
  const until = rule.match(/UNTIL=(\d{4})(\d{2})(\d{2})/);
  return {
    start: start ? `${start[1]}-${start[2]}-${start[3]}` : "1970-01-01",
    interval: interval ? Number(interval[1]) : 1,
    days: (days ? days[1].split(",") : []).filter((d): d is WeekdayCode => (WEEKDAY_CODES as readonly string[]).includes(d)),
    until: until ? `${until[1]}-${until[2]}-${until[3]}` : null,
  };
}

const toDate = (day: string) => new Date(`${day}T00:00:00Z`);

/** Calendar dates (inclusive range) on which the rule fires. */
export function occurrences(rule: string, from: string, to: string): string[] {
  if (to < from) return [];
  return RRule.fromString(rule)
    .between(toDate(from), toDate(to), true)
    .map((d) => d.toISOString().slice(0, 10));
}

export function describeRule(r: Recurrence): string {
  const names: Record<WeekdayCode, string> = { MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat", SU: "Sun" };
  const ordered = WEEKDAY_CODES.filter((d) => r.days.includes(d));
  const days =
    ordered.length === 7 ? "Every day" : ordered.length === 5 && !ordered.includes("SA") && !ordered.includes("SU") ? "Weekdays" : ordered.map((d) => names[d]).join(", ");
  return r.interval > 1 ? `${days}, every ${r.interval} weeks` : days;
}
