import { shiftDay, weekDays } from "./time";

export type Mapping = {
  title: string | null;
  date: string | null;
  week: string | null;
  weekday: string | null;
  start: string | null;
  duration: string | null;
  section: string | null;
  notes: string | null;
};

export type ImportRow = {
  line: number;
  title: string;
  date: string;
  start: string | null;
  minutes: number | null;
  sectionName: string | null;
  notes: string;
};

export type ImportIssue = { line: number; message: string };

const pad = (n: number) => String(n).padStart(2, "0");

function validDate(y: number, m: number, d: number) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** ISO dates, or day-first d/m/y with / - or . separators. */
export function parseDate(raw: string, order: "dmy" | "mdy" = "dmy"): string | null {
  const v = raw.trim();
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return validDate(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
  }
  m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    const y = Number(m[3]) < 100 ? Number(m[3]) + 2000 : Number(m[3]);
    const [d, mo] = order === "dmy" ? [a, b] : [b, a];
    return validDate(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
  }
  return null;
}

export function parseTime(raw: string): string | null {
  const v = raw.trim().toLowerCase().replace(/\s+/g, "");
  let m = v.match(/^([01]?\d|2[0-3])[:.h]([0-5]\d)$/);
  if (m) return `${pad(Number(m[1]))}:${m[2]}`;
  m = v.match(/^(1[0-2]|0?[1-9])(?::([0-5]\d))?(am|pm)$/);
  if (m) {
    let h = Number(m[1]) % 12;
    if (m[3] === "pm") h += 12;
    return `${pad(h)}:${m[2] ?? "00"}`;
  }
  m = v.match(/^([01]\d|2[0-3])([0-5]\d)$/);
  if (m) return `${m[1]}:${m[2]}`;
  return null;
}

/** "45", "45m", "45 min", "1h", "1h30", "1:30", "1.5h", "90 minutes". */
export function parseDuration(raw: string): number | null {
  const v = raw.trim().toLowerCase().replace(/\s+/g, "").replace(",", ".");
  if (!v) return null;
  let m = v.match(/^(\d+(?:\.\d+)?)(m|min|mins|minute|minutes)?$/);
  if (m) return Math.round(Number(m[1]));
  m = v.match(/^(\d+(?:\.\d+)?)(h|hr|hrs|hour|hours|u|uur)$/);
  if (m) return Math.round(Number(m[1]) * 60);
  m = v.match(/^(\d+)h(\d{1,2})(m|min)?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = v.match(/^(\d+):([0-5]\d)(?::[0-5]\d)?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return null;
}

const WEEKDAYS: [RegExp, number][] = [
  [/^(mon|monday|ma|maandag|lun|lunedi|lunedì|1)$/, 0],
  [/^(tue|tues|tuesday|di|dinsdag|mar|martedi|martedì|2)$/, 1],
  [/^(wed|wednesday|wo|woensdag|mer|mercoledi|mercoledì|3)$/, 2],
  [/^(thu|thur|thurs|thursday|do|donderdag|gio|giovedi|giovedì|4)$/, 3],
  [/^(fri|friday|vr|vrijdag|ven|venerdi|venerdì|5)$/, 4],
  [/^(sat|saturday|za|zaterdag|sab|sabato|6)$/, 5],
  [/^(sun|sunday|zo|zondag|dom|domenica|7)$/, 6],
];

/** 0 = Monday ... 6 = Sunday. */
export function parseWeekday(raw: string): number | null {
  const v = raw.trim().toLowerCase().replace(/\.$/, "");
  for (const [re, i] of WEEKDAYS) if (re.test(v)) return i;
  return null;
}

const GUESS: Record<keyof Mapping, RegExp> = {
  title: /^(title|task|name|session|workout|activity|training|omschrijving|titel|sessie)$/i,
  date: /^(date|day date|datum|data|when)$/i,
  week: /^(week|wk|week ?(no|nr|number)?)$/i,
  weekday: /^(day|weekday|dag|giorno)$/i,
  start: /^(start|time|start ?time|tijd|ora|begin)$/i,
  duration: /^(duration|minutes|mins|length|duur|durata|time ?\(min\))$/i,
  section: /^(section|category|sport|discipline|type|categorie)$/i,
  notes: /^(notes|description|details|note|opmerking|beschrijving|descrizione)$/i,
};

/** Best-effort column guess from header names. */
export function guessMapping(headers: string[]): Mapping {
  const used = new Set<string>();
  const pick = (key: keyof Mapping) => {
    const h = headers.find((x) => !used.has(x) && GUESS[key].test(x.trim()));
    if (h) used.add(h);
    return h ?? null;
  };
  const m = {} as Mapping;
  for (const key of ["date", "week", "weekday", "title", "start", "duration", "section", "notes"] as (keyof Mapping)[]) {
    m[key] = pick(key);
  }
  if (!m.title) m.title = headers.find((h) => !used.has(h)) ?? null;
  return m;
}

/**
 * Turns parsed records into importable rows. Rows can carry a real date, or
 * a week number plus weekday counted from `planStart` (week 1 = its week).
 */
export function buildRows(
  records: Record<string, string>[],
  mapping: Mapping,
  options: { planStart: string; dateOrder?: "dmy" | "mdy" },
): { rows: ImportRow[]; issues: ImportIssue[] } {
  const rows: ImportRow[] = [];
  const issues: ImportIssue[] = [];
  const week1 = weekDays(options.planStart, 1)[0];
  records.forEach((rec, i) => {
    const line = i + 2; // header is line 1
    const get = (col: string | null) => (col ? String(rec[col] ?? "").trim() : "");
    const title = get(mapping.title);
    if (!title) {
      if (Object.values(rec).some((v) => String(v ?? "").trim())) issues.push({ line, message: "No title" });
      return;
    }
    let date: string | null = null;
    if (mapping.date && get(mapping.date)) {
      date = parseDate(get(mapping.date), options.dateOrder);
      if (!date) return issues.push({ line, message: `Unreadable date "${get(mapping.date)}"` });
    } else if (mapping.weekday) {
      const wd = parseWeekday(get(mapping.weekday));
      const wk = mapping.week ? Number(get(mapping.week).replace(/\D/g, "")) : 1;
      if (wd === null) return issues.push({ line, message: `Unreadable day "${get(mapping.weekday)}"` });
      if (!wk || wk < 1) return issues.push({ line, message: `Unreadable week "${get(mapping.week)}"` });
      date = shiftDay(week1, (wk - 1) * 7 + wd);
    } else {
      return issues.push({ line, message: "No date" });
    }
    const startRaw = get(mapping.start);
    const start = startRaw ? parseTime(startRaw) : null;
    if (startRaw && !start) issues.push({ line, message: `Ignored start time "${startRaw}"` });
    const durRaw = get(mapping.duration);
    const minutes = durRaw ? parseDuration(durRaw) : null;
    if (durRaw && minutes === null) issues.push({ line, message: `Ignored duration "${durRaw}"` });
    rows.push({
      line,
      title: title.slice(0, 300),
      date,
      start,
      minutes: minutes && minutes > 0 && minutes <= 1440 ? minutes : null,
      sectionName: get(mapping.section) || null,
      notes: get(mapping.notes),
    });
  });
  return { rows, issues };
}
