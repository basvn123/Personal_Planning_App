"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, inputClass } from "@/components/ui/button";
import { createSchedule, deleteSchedule, setScheduleActive, updateSchedule } from "@/server/actions/schedules";
import { WEEKDAY_CODES, type Recurrence, type WeekdayCode } from "@/lib/recurrence";
import { formatMinutes } from "@/lib/time";
import { cx } from "@/lib/cx";

const DAY_LABELS: Record<WeekdayCode, string> = { MO: "M", TU: "T", WE: "W", TH: "T", FR: "F", SA: "S", SU: "S" };
const DAY_NAMES: Record<WeekdayCode, string> = { MO: "Monday", TU: "Tuesday", WE: "Wednesday", TH: "Thursday", FR: "Friday", SA: "Saturday", SU: "Sunday" };
const DURATIONS = [15, 30, 45, 60, 75, 90, 120, 180];

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
  sections: { id: string; name: string }[];
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
      setError(days.length === 0 ? "Pick at least one day." : "Give it a name.");
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
        setError("Could not save the schedule.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex max-w-md flex-col gap-5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What happens, e.g. Course X lecture"
        aria-label="Title"
        maxLength={200}
        autoFocus={!draft.id}
        className="w-full bg-transparent text-xl font-semibold tracking-[-0.02em] outline-none placeholder:text-ink-3"
      />

      <Row label="Section">
        <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={inputClass} aria-label="Section">
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Row>

      <Row label="Repeats on">
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
                "grid size-9 place-items-center rounded-sm text-sm font-medium transition-colors",
                days.includes(d) ? "bg-cloth text-cloth-ink" : "bg-paper-3 text-ink-2 hover:text-ink",
              )}
            >
              {DAY_LABELS[d]}
            </button>
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-ink-2">
          Every
          <select
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            className={cx(inputClass, "h-8 w-16")}
            aria-label="Week interval"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {interval === 1 ? "week" : "weeks"}
        </label>
      </Row>

      <div className="grid grid-cols-2 gap-3">
        <Row label="At">
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={cx(inputClass, "figures")} aria-label="Start time" />
        </Row>
        <Row label="For">
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={cx(inputClass, "figures")} aria-label="Duration">
            {[...new Set([...DURATIONS, duration])].sort((a, b) => a - b).map((m) => (
              <option key={m} value={m}>
                {formatMinutes(m)}
              </option>
            ))}
          </select>
        </Row>
        <Row label="From">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required className={cx(inputClass, "figures")} aria-label="First day" />
        </Row>
        <Row label="Until">
          <input type="date" value={until} min={start} onChange={(e) => setUntil(e.target.value)} className={cx(inputClass, "figures")} aria-label="Last day" />
        </Row>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-2 border-t border-rule pt-4">
        <Button type="submit" variant="primary" disabled={pending}>
          {draft.id ? "Save" : "Create schedule"}
        </Button>
        {draft.id && (
          <>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => run(async () => setScheduleActive(draft.id!, !draft.active))}
            >
              {draft.active ? "Pause" : "Resume"}
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
                Delete schedule
              </Button>
            ) : (
              <Button variant="ghost" className="ml-auto text-danger hover:text-danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </>
        )}
      </div>
      {draft.id && (
        <p className="-mt-2 text-xs text-ink-3">
          Saving rewrites upcoming occurrences you have not touched. Edited, started or finished ones stay.
        </p>
      )}
    </form>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{label}</span>
      {children}
    </div>
  );
}
