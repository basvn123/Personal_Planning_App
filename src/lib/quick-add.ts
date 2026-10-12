import { shiftDay } from "./time";

export type QuickAddSection = { id: string; name: string; slug: string };

export type QuickAdd = {
  title: string;
  sectionId: string | null;
  plannedDate: string | null | undefined; // undefined: not mentioned, null: backlog
  plannedStart: string | null;
  plannedMinutes: number | null;
};

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function dayOfWeek(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Parses "Read chapter 3 #italian tomorrow 14:00 45m".
 * Tokens: #section, today/tomorrow/weekday/YYYY-MM-DD/d-m or d/m, "backlog",
 * HH:MM or 9am/2pm, durations 45m, 2h, 1h30.
 */
export function parseQuickAdd(input: string, today: string, sections: QuickAddSection[]): QuickAdd {
  const out: QuickAdd = { title: "", sectionId: null, plannedDate: undefined, plannedStart: null, plannedMinutes: null };
  const keep: string[] = [];
  const tokens = input.trim().split(/\s+/).filter(Boolean);

  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i];
    const t = raw.toLowerCase();

    if (t.startsWith("#") && t.length > 1) {
      // Allow multi-word names by trying the longest match first.
      let matched = false;
      for (let len = Math.min(4, tokens.length - i); len >= 1 && !matched; len--) {
        const phrase = tokens.slice(i, i + len).join(" ").slice(1).toLowerCase();
        const hit = sections.find((s) => s.slug === phrase || s.name.toLowerCase() === phrase || s.slug === phrase.replace(/\s+/g, "-"));
        if (hit) {
          out.sectionId = hit.id;
          i += len - 1;
          matched = true;
        }
      }
      if (!matched) {
        const prefix = t.slice(1);
        const hit = sections.find((s) => s.slug.startsWith(prefix) || s.name.toLowerCase().startsWith(prefix));
        if (hit) out.sectionId = hit.id;
        else keep.push(raw);
      }
      continue;
    }

    if (t === "today" || t === "tod") {
      out.plannedDate = today;
      continue;
    }
    if (t === "tomorrow" || t === "tmr" || t === "tom") {
      out.plannedDate = shiftDay(today, 1);
      continue;
    }
    if (t === "backlog" || t === "someday") {
      out.plannedDate = null;
      continue;
    }
    const wd = WEEKDAYS.findIndex((w) => t === w || (t.length >= 3 && w.startsWith(t.slice(0, 3)) && /^(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(day)?$/.test(t)));
    if (wd >= 0) {
      const diff = (wd - dayOfWeek(today) + 7) % 7 || 7;
      out.plannedDate = shiftDay(today, diff);
      continue;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
      out.plannedDate = t;
      continue;
    }
    const dm = t.match(/^(\d{1,2})[/-](\d{1,2})$/);
    if (dm) {
      const [d, m] = [Number(dm[1]), Number(dm[2])];
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
        let year = Number(today.slice(0, 4));
        const candidate = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (candidate < today) year += 1;
        out.plannedDate = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        continue;
      }
    }
    const hm = t.match(/^([01]?\d|2[0-3])[:.]([0-5]\d)$/);
    if (hm) {
      out.plannedStart = `${hm[1].padStart(2, "0")}:${hm[2]}`;
      continue;
    }
    const ampm = t.match(/^(1[0-2]|0?[1-9])(?::([0-5]\d))?(am|pm)$/);
    if (ampm) {
      let h = Number(ampm[1]) % 12;
      if (ampm[3] === "pm") h += 12;
      out.plannedStart = `${String(h).padStart(2, "0")}:${ampm[2] ?? "00"}`;
      continue;
    }
    const dur = t.match(/^(?:(\d{1,2})h)?(?:(\d{1,3})m?)?$/);
    if (dur && (dur[1] || (dur[2] && t.endsWith("m"))) && !/^\d+$/.test(t)) {
      const minutes = Number(dur[1] ?? 0) * 60 + Number(dur[2] ?? 0);
      if (minutes > 0 && minutes <= 24 * 60) {
        out.plannedMinutes = minutes;
        continue;
      }
    }
    keep.push(raw);
  }

  out.title = keep.join(" ").trim();
  return out;
}
