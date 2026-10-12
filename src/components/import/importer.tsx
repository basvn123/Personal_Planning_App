"use client";

import Link from "next/link";
import Papa from "papaparse";
import { useMemo, useState, useTransition } from "react";
import { FileUp, TriangleAlert } from "lucide-react";
import { Button, inputClass } from "@/components/ui/button";
import { importTasks } from "@/server/actions/imports";
import { buildRows, guessMapping, type Mapping } from "@/lib/import-parse";
import { formatDay, formatMinutes } from "@/lib/time";
import { cx } from "@/lib/cx";

type Section = { id: string; name: string };

const FIELDS: { key: keyof Mapping; label: string }[] = [
  { key: "title", label: "Titel" },
  { key: "date", label: "Datum" },
  { key: "week", label: "Weeknummer" },
  { key: "weekday", label: "Weekdag" },
  { key: "start", label: "Begintijd" },
  { key: "duration", label: "Duur" },
  { key: "section", label: "Sectie" },
  { key: "notes", label: "Notities" },
];

const TEMPLATE =
  "week,dag,titel,start,duur,sectie,notities\n1,ma,Zwemtechniek,07:00,45,Triathlon,4x100 drills\n1,wo,Tempoloop,18:30,50,Triathlon,\n1,zo,Lange rit,09:00,2h30,Triathlon,Zone 2\n";

function recordsFromJson(text: string): Record<string, string>[] {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : Object.values(data).find(Array.isArray);
  if (!Array.isArray(list)) throw new Error("Geen lijst gevonden in de JSON.");
  return list
    .filter((x) => x && typeof x === "object")
    .map((x) => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, v == null ? "" : String(v)])));
}

export function Importer({ sections, today }: { sections: Section[]; today: string }) {
  const [file, setFile] = useState<{ name: string; kind: "csv" | "json" } | null>(null);
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [planStart, setPlanStart] = useState(today);
  const [dateOrder, setDateOrder] = useState<"dmy" | "mdy">("dmy");
  const [defaultSectionId, setDefaultSectionId] = useState(sections[0]?.id ?? "");
  const [createSections, setCreateSections] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ count: number; firstDate: string } | null>(null);
  const [pending, run] = useTransition();

  async function load(f: File) {
    setError(null);
    setDone(null);
    const text = await f.text();
    try {
      const kind = /\.json$/i.test(f.name) || text.trim().startsWith("[") || text.trim().startsWith("{") ? "json" : "csv";
      let recs: Record<string, string>[];
      if (kind === "json") recs = recordsFromJson(text);
      else {
        const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy", transformHeader: (h) => h.trim() });
        recs = parsed.data;
      }
      if (recs.length === 0) throw new Error("Het bestand heeft geen regels.");
      const hs = [...new Set(recs.flatMap((r) => Object.keys(r)))].filter(Boolean);
      setFile({ name: f.name, kind });
      setRecords(recs);
      setHeaders(hs);
      setMapping(guessMapping(hs));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dat bestand kon niet gelezen worden.");
    }
  }

  const result = useMemo(
    () => (mapping ? buildRows(records, mapping, { planStart, dateOrder }) : { rows: [], issues: [] }),
    [records, mapping, planStart, dateOrder],
  );
  const known = new Set(sections.map((s) => s.name.toLowerCase()));
  const usesWeeks = mapping && !mapping.date && mapping.weekday;

  function submit() {
    if (!file || result.rows.length === 0) return;
    setError(null);
    run(async () => {
      try {
        const { count } = await importTasks({
          filename: file.name,
          kind: file.kind,
          defaultSectionId,
          createSections,
          rows: result.rows.map(({ title, date, start, minutes, sectionName, notes }) => ({ title, date, start, minutes, sectionName, notes })),
        });
        setDone({ count, firstDate: [...result.rows].sort((a, b) => a.date.localeCompare(b.date))[0].date });
        setFile(null);
        setRecords([]);
        setMapping(null);
      } catch {
        setError("Importeren mislukt. Er is niets toegevoegd.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) load(f);
        }}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-rule-strong bg-canvas px-6 py-8 text-center transition-colors hover:border-cloth-3"
      >
        <FileUp className="size-5 text-ink-2" strokeWidth={1.75} />
        <span className="text-base text-ink">{file ? (
            file.name
          ) : (
            <>
              <span className="max-lg:hidden">Sleep een CSV- of JSON-bestand hierheen, of klik om te kiezen</span>
              <span className="lg:hidden">Tik om een CSV- of JSON-bestand te kiezen</span>
            </>
          )}</span>
        <span className="text-xs text-ink-3">
          {file ? `${records.length} regels` : "Met datums, of met weeknummer en weekdag."}
        </span>
        <input
          type="file"
          accept=".csv,.json,.txt,text/csv,application/json"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) load(f);
            e.target.value = "";
          }}
        />
      </label>

      {done && (
        <p role="status" className="rounded-sm bg-ribbon-wash px-3 py-2.5 text-sm text-ink">
          {done.count} taken toegevoegd.{" "}
          <Link href={`/week?d=${done.firstDate}`} className="font-medium underline">
            Open de eerste week
          </Link>
        </p>
      )}
      {error && <p role="alert" className="rounded-sm bg-danger-wash px-3 py-2.5 text-sm text-danger">{error}</p>}

      {mapping && (
        <>
          <section aria-label="Kolommen" className="flex flex-col gap-3">
            <h3 className="border-b border-rule pb-1.5 text-sm font-semibold text-ink">Kolommen</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4">
              {FIELDS.map(({ key, label }) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-xs text-ink-2">{label}</span>
                  <select
                    value={mapping[key] ?? ""}
                    onChange={(e) => setMapping({ ...mapping, [key]: e.target.value || null })}
                    className={cx(inputClass, "h-8 text-sm", !mapping[key] && "text-ink-3")}
                  >
                    <option value="">Geen</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4">
              {usesWeeks ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-ink-2">Week 1 begint op</span>
                  <input type="date" value={planStart} onChange={(e) => setPlanStart(e.target.value)} className={cx(inputClass, "figures h-8 text-sm")} />
                </label>
              ) : (
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-ink-2">Datumvolgorde</span>
                  <select value={dateOrder} onChange={(e) => setDateOrder(e.target.value as "dmy" | "mdy")} className={cx(inputClass, "h-8 text-sm")}>
                    <option value="dmy">Dag eerst</option>
                    <option value="mdy">Maand eerst</option>
                  </select>
                </label>
              )}
              <label className="flex flex-col gap-1">
                <span className="text-xs text-ink-2">Standaardsectie</span>
                <select value={defaultSectionId} onChange={(e) => setDefaultSectionId(e.target.value)} className={cx(inputClass, "h-8 text-sm")}>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              {mapping.section && (
                <label className="col-span-2 flex items-center gap-2 self-end pb-1.5 text-sm text-ink-2">
                  <input type="checkbox" checked={createSections} onChange={(e) => setCreateSections(e.target.checked)} className="accent-[var(--cloth)]" />
                  Ontbrekende secties aanmaken
                </label>
              )}
            </div>
          </section>

          <section aria-label="Voorbeeld" className="flex flex-col gap-2">
            <div className="flex items-center border-b border-rule pb-1.5">
              <h3 className="text-sm font-semibold text-ink">Voorbeeld</h3>
              <span className="figures ml-auto text-xs text-ink-3">
                {result.rows.length} klaar{result.issues.length > 0 && `, ${result.issues.length} opmerkingen`}
              </span>
            </div>
            {result.issues.length > 0 && (
              <ul className="flex flex-col gap-0.5 text-xs text-ink-2">
                {result.issues.slice(0, 6).map((iss, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <TriangleAlert className="size-3 shrink-0 text-ribbon-ink" strokeWidth={2} />
                    <span className="figures text-ink-3">Regel {iss.line}</span> {iss.message}
                  </li>
                ))}
                {result.issues.length > 6 && <li className="text-ink-3">en nog {result.issues.length - 6}</li>}
              </ul>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-sm">
                <thead>
                  <tr className="text-left text-2xs uppercase tracking-[0.06em] text-ink-3">
                    <th className="py-1.5 pr-3 font-medium">Dag</th>
                    <th className="py-1.5 pr-3 font-medium">Om</th>
                    <th className="py-1.5 pr-3 font-medium">Duur</th>
                    <th className="py-1.5 pr-3 font-medium">Titel</th>
                    <th className="py-1.5 font-medium">Sectie</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.slice(0, 60).map((r) => {
                    const sectionLabel = r.sectionName ?? sections.find((s) => s.id === defaultSectionId)?.name;
                    const isNew = r.sectionName && !known.has(r.sectionName.toLowerCase());
                    return (
                      <tr key={r.line} className="border-t border-rule">
                        <td className="figures whitespace-nowrap py-1.5 pr-3 text-ink-2">{formatDay(r.date, "EEEEEE d MMM")}</td>
                        <td className="figures py-1.5 pr-3 text-ink-2">{r.start ?? ""}</td>
                        <td className="figures py-1.5 pr-3 text-ink-2">{r.minutes ? formatMinutes(r.minutes) : ""}</td>
                        <td className="py-1.5 pr-3 text-ink">{r.title}</td>
                        <td className="whitespace-nowrap py-1.5 text-ink-2">
                          {sectionLabel}
                          {isNew && (
                            <span className="ml-1.5 text-2xs text-ribbon-ink">{createSections ? "nieuw" : "standaard"}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {result.rows.length > 60 && <p className="pt-2 text-xs text-ink-3">en nog {result.rows.length - 60} regels</p>}
            </div>
            <div className="pt-3">
              <Button variant="primary" onClick={submit} disabled={pending || result.rows.length === 0}>
                {result.rows.length} taken toevoegen
              </Button>
            </div>
          </section>
        </>
      )}

      {!mapping && (
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`}
          download="planner-voorbeeld.csv"
          className="self-start text-sm text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-ink"
        >
          Voorbeeldbestand downloaden
        </a>
      )}
    </div>
  );
}
