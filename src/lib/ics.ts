import { zonedInstant } from "./zoned";

export type IcsEvent = {
  uid: string;
  title: string;
  description?: string;
  categories?: string;
  date: string; // YYYY-MM-DD local
  start?: string | null; // HH:MM local
  minutes?: number | null;
  done?: boolean;
  updated: Date;
};

const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Folds content lines at 75 octets as RFC 5545 requires. */
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join("\r\n ");
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const compactDay = (day: string) => day.replace(/-/g, "");

function nextDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10).replace(/-/g, "");
}

/** Builds an RFC 5545 calendar; untimed tasks become all-day events. */
export function buildCalendar(events: IcsEvent[], tz: string, name: string) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escape(name)}`,
    `X-WR-TIMEZONE:${tz}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.uid}`, `DTSTAMP:${stamp(e.updated)}`, `LAST-MODIFIED:${stamp(e.updated)}`);
    if (e.start) {
      // Exact instants in UTC: valid everywhere without a VTIMEZONE block.
      const begin = zonedInstant(e.date, e.start.slice(0, 5), tz);
      const finish = new Date(begin.getTime() + (e.minutes ?? 30) * 60_000);
      lines.push(`DTSTART:${stamp(begin)}`, `DTEND:${stamp(finish)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${compactDay(e.date)}`, `DTEND;VALUE=DATE:${nextDay(e.date)}`, "TRANSP:TRANSPARENT");
    }
    lines.push(`SUMMARY:${escape(e.done ? `${e.title} (done)` : e.title)}`);
    if (e.description) lines.push(`DESCRIPTION:${escape(e.description)}`);
    if (e.categories) lines.push(`CATEGORIES:${escape(e.categories)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
