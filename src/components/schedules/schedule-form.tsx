"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, inputClass } from "@/components/ui/button";
import { createSchedule, deleteSchedule, setScheduleActive, updateSchedule } from "@/server/actions/schedules";
import { WEEKDAY_CODES, type Recurrence, type WeekdayCode } from "@/lib/recurrence";
import { cx } from "@/lib/cx";
import { DurationChips, FieldGroup as Row, SectionChips } from "@/components/planner/task-fields";

const DAY_LABELS: Record<WeekdayCode, string> = { MO: "M", TU: "D", WE: "W", TH: "D", FR: "V", SA: "Z", SU: "Z" };
const DAY_NAMES: Record<WeekdayCode, string> = { MO: "maandag", TU: "dinsdag", WE: "woensdag", TH: "donderdag", FR: "vrijdag", SA: "zaterdag", SU: "zondag" };

export type ScheduleDraft = {
  id?: string;
  title: string;
  sectionId: string;
  recurrence: Recurrence;
  startTime: string;
  durationMinutes: number;
  active: boolean;
};

export function ScheduleForm({
  draft,
  sections,
}: {
  draft: ScheduleDraft;
  sections: { id: string; name: string; color: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(draft.title);
  const [sectionId, setSectionId] = useState(draft.sectionId);
  const [days, setDays] = useState<WeekdayCode[]>(draft.recurrence.days);
  const [interval, setInterval] = useState(draft.recurrence.interval);
  const [start, setStart] = useState(draft.recurrence.start);
  const [until, setUntil] = useState(draft.recurrence.until ?? "");
  const [startTime, setStartTime] = useState(draft.startTime);
  const [duration, setDuration] = useState(draft.durationMinutes);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, run] = useTransition();

  function toggleDay(d: WeekdayCode) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || days.length === 0) {
      setError(days.length === 0 ? "Kies minstens één dag." : "Geef het een naam.");
      return;
    }
    setError(null);
    const input = {
      title,
      sectionId,
      days,
      interval,
      start,
      until: until || null,
      startTime,
      durationMinutes: duration,
    };
    run(async () => {
      try {
        if (draft.id) await updateSchedule(draft.id, input);
        else await createSchedule(input);
        router.push("/schedules");
      } catch {
        setError("Opslaan mislukt.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex max-w-md flex-col gap-5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Wat gebeurt er, bv. hoorcollege vak X"
        aria-label="Titel"
        maxLength={200}
        autoFocus={!draft.id}
        className="w-full bg-transparent text-xl font-semibold tracking-[-0.02em] outline-none placeholder:text-ink-3"
      />

      <Row label="Sectie">
        <SectionChips sections={sections} value={sectionId} onChange={setSectionId} />
      </Row>

      <Row label="Herhaalt op">
        <div className="flex gap-1">
          {WEEKDAY_CODES.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={days.includes(d)}
              aria-label={DAY_NAMES[d]}
              title={DAY_NAMES[d]}
              onClick={() => toggleDay(d)}
              className={cx(
                "grid size-10 place-items-center rounded-sm text-sm font-medium transition-colors lg:size-9",
                days.includes(d) ? "bg-cloth text-cloth-ink" : "bg-paper-3 text-ink-2 hover:text-ink",
              )}
            >
              {DAY_LABELS[d]}
            </button>
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-ink-2">
          Elke
          <select
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            className={cx(inputClass, "h-8 w-16")}
            aria-label="Om de hoeveel weken"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {interval === 1 ? "week" : "weken"}
        </label>
      </Row>

      <Row label="Duur">
        <DurationChips value={duration} onChange={(m) => m && setDuration(m)} />
      </Row>

      <div className="grid grid-cols-2 gap-3">
        <Row label="Om">
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={cx(inputClass, "figures")} aria-label="Begintijd" />
        </Row>
        <Row label="Vanaf">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required className={cx(inputClass, "figures")} aria-label="Eerste dag" />
        </Row>
        <Row label="Tot en met">
          <input type="date" value={until} min={start} onChange={(e) => setUntil(e.target.value)} className={cx(inputClass, "figures")} aria-label="Laatste dag" />
        </Row>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-2 border-t border-rule pt-4">
        <Button type="submit" variant="primary" disabled={pending}>
          {draft.id ? "Opslaan" : "Vaste planning maken"}
        </Button>
        {draft.id && (
          <>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => run(async () => setScheduleActive(draft.id!, !draft.active))}
            >
              {draft.active ? "Pauzeren" : "Hervatten"}
            </Button>
            {confirmDelete ? (
              <Button
                variant="danger"
                className="ml-auto"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    await deleteSchedule(draft.id!);
                    router.push("/schedules");
                  })
                }
              >
                Vaste planning verwijderen
              </Button>
            ) : (
              <Button variant="ghost" className="ml-auto text-danger hover:text-danger" onClick={() => setConfirmDelete(true)}>
                Verwijderen
              </Button>
            )}
          </>
        )}
      </div>
      {draft.id && (
        <p className="-mt-2 text-xs text-ink-3">
          Opslaan herschrijft komende keren die je niet aangepast hebt. Aangepaste, gestarte en afgeronde blijven staan.
        </p>
      )}
    </form>
  );
}
