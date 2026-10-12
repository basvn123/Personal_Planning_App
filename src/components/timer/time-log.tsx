"use client";

import { useState, useTransition } from "react";
import { History, Plus, Timer, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, inputClass } from "@/components/ui/button";
import { addManualEntry, deleteEntry, updateEntry } from "@/server/actions/time";
import type { LogEntry } from "@/server/queries/time";
import type { PlannerTask } from "@/server/queries/tasks";
import type { PlannerSection } from "@/components/planner/planner-context";
import { formatClock, formatDuration } from "@/lib/time";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";
import { useElapsed } from "./timer-context";

export function TimeLog({
  day,
  entries,
  tasks,
  sections,
}: {
  day: string;
  entries: LogEntry[];
  tasks: PlannerTask[];
  sections: PlannerSection[];
}) {
  const [adding, setAdding] = useState(false);
  const total = entries.reduce((sum, e) => sum + (e.endedAt ? e.seconds : 0), 0);
  return (
    <Card
      icon={History}
      title="Logboek"
      meta={total > 0 ? `${formatDuration(total)} gelogd` : undefined}
      action={
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          aria-expanded={adding}
          className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-[var(--link)] hover:bg-paper-3 lg:h-8 lg:text-xs"
        >
          <Plus className="size-4" strokeWidth={2.25} />
          Tijd loggen
        </button>
      }
    >
      {adding && <AddEntry day={day} tasks={tasks} sections={sections} onDone={() => setAdding(false)} />}
      <ul className="divide-y divide-rule">
        {entries.map((e) => (
          <EntryRow key={e.id} entry={e} />
        ))}
      </ul>
      {entries.length === 0 && !adding && (
        <EmptyState icon={Timer} text="Start de timer op een taak met de afspeelknop, of log achteraf met Tijd loggen." />
      )}
    </Card>
  );
}

function EntryRow({ entry }: { entry: LogEntry }) {
  const running = !entry.endedAt;
  const live = useElapsed(running ? entry.startedAt : null);
  const seconds = running ? live : entry.seconds;
  const [start, setStart] = useState(entry.startClock);
  const [end, setEnd] = useState(entry.endClock ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, run] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <li style={dyeVars(entry.section.color)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="flex min-h-11 w-full items-center gap-3 text-left text-sm transition-colors hover:bg-paper-3/60">
          <span className="figures min-w-[7rem] shrink-0 whitespace-nowrap text-ink-2">
            {entry.startClock}
            <span className="text-ink-3">{" tot "}</span>
            {entry.endClock ?? "nu"}
          </span>
          <span className="size-2 shrink-0 rounded-[2px] bg-[var(--dye)]" />
          <span className="min-w-0 flex-1 truncate">{entry.task?.title ?? entry.section.name}</span>
          <span className={cx("figures shrink-0", running ? "text-ribbon-ink" : "text-ink-2")}>
            {running ? formatClock(seconds) : formatDuration(seconds)}
          </span>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(18rem,calc(100vw-1.5rem))]">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              run(async () => {
                try {
                  await updateEntry(entry.id, { day: entry.day, start, end: end || null });
                  setOpen(false);
                } catch {
                  setError("Kijk de tijden na.");
                }
              });
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <TimeField label="Van" value={start} onChange={setStart} />
              <TimeField label="Tot" value={end} onChange={setEnd} required={!running} />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="text-danger hover:text-danger"
                disabled={pending}
                onClick={() => run(async () => deleteEntry(entry.id))}
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
                Verwijderen
              </Button>
              <Button type="submit" variant="primary" className="ml-auto" disabled={pending}>
                Opslaan
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </li>
  );
}

function AddEntry({
  day,
  tasks,
  sections,
  onDone,
}: {
  day: string;
  tasks: PlannerTask[];
  sections: PlannerSection[];
  onDone: () => void;
}) {
  const [target, setTarget] = useState(() => (tasks[0] ? `t:${tasks[0].id}` : sections[0] ? `s:${sections[0].id}` : ""));
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, run] = useTransition();

  return (
    <form
      className="grid grid-cols-2 gap-2 border-b border-rule py-3 sm:grid-cols-[minmax(0,1fr)_7.5rem_7.5rem_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (!target || !start || !end) return;
        setError(null);
        const [kind, id] = target.split(":");
        run(async () => {
          try {
            await addManualEntry({
              day,
              start,
              end,
              ...(kind === "t" ? { taskId: id } : { sectionId: id }),
            });
            setStart("");
            setEnd("");
            onDone();
          } catch {
            setError("Loggen mislukt.");
          }
        });
      }}
    >
      <label className="col-span-2 flex flex-col gap-1 sm:col-span-1">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">Voor</span>
        <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
          {tasks.length > 0 && (
            <optgroup label="Taken van deze dag">
              {tasks.map((t) => (
                <option key={t.id} value={`t:${t.id}`}>
                  {t.title}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="Alleen sectie">
            {sections.map((s) => (
              <option key={s.id} value={`s:${s.id}`}>
                {s.name}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <TimeField label="Van" value={start} onChange={setStart} required />
      <TimeField label="Tot" value={end} onChange={setEnd} required />
      <Button type="submit" variant="primary" disabled={pending} className="col-span-2 h-9 sm:col-span-1">
        Loggen
      </Button>
      {error && <p className="col-span-full text-sm text-danger">{error}</p>}
    </form>
  );
}

function TimeField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    // min-w-0 everywhere: a native time input is wider than a narrow grid column by default and spills over its neighbour.
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{label}</span>
      <input
        type="time"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={cx(inputClass, "figures min-w-0 px-2 [&::-webkit-date-and-time-value]:text-left")}
      />
    </label>
  );
}
