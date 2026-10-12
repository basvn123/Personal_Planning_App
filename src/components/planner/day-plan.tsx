"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { formatDay, formatDuration, shiftDay } from "@/lib/time";
import { InlineAdd } from "./inline-add";
import { sortDay, usePlanner } from "./planner-context";
import { TaskRow } from "./task-row";
import { TimeLog } from "@/components/timer/time-log";
import type { LogEntry } from "@/server/queries/time";

export function DayPlan({
  days,
  logged,
  entries,
}: {
  days: string[];
  logged: Record<string, number>;
  entries: LogEntry[];
}) {
  const router = useRouter();
  const { tasks, sections, today, selectedDay, selectDay, error } = usePlanner();
  const day = selectedDay;
  const dayTasks = sortDay(tasks.filter((t) => t.plannedDate === day));
  const timed = dayTasks.filter((t) => t.plannedStart);
  const anytime = dayTasks.filter((t) => !t.plannedStart);
  const planned = dayTasks.reduce((s, t) => s + (t.plannedMinutes ?? 0) * 60, 0);
  const done = dayTasks.filter((t) => t.status === "done").length;

  function go(offset: number) {
    const next = shiftDay(day, offset);
    if (days.includes(next)) selectDay(next);
    else router.push(`/week?d=${next}&day=${next}`);
  }

  const label = day === today ? "Today" : day === shiftDay(today, 1) ? "Tomorrow" : day === shiftDay(today, -1) ? "Yesterday" : null;

  return (
    <div className="flex min-h-full flex-col px-5 pb-16 pt-6 lg:px-10">
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">{formatDay(day, "EEEE d MMMM")}</h2>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-ink-2">
            {label && <span className="text-ribbon-ink">{label}</span>}
            <span className="figures">{formatDuration(logged[day] ?? 0)} logged</span>
            {planned > 0 && <span className="figures">{formatDuration(planned)} planned</span>}
            {dayTasks.length > 0 && (
              <span className="figures">
                {done}/{dayTasks.length} done
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center">
          <IconButton label="Previous day" onClick={() => go(-1)}>
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Next day" onClick={() => go(1)}>
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </IconButton>
        </div>
      </header>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-danger-wash px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {timed.length > 0 && (
        <section aria-label="Scheduled" className="mt-7">
          <h3 className="border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">
            Scheduled
          </h3>
          <ul>
            {timed.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                variant="day"
                lead={
                  <span className="figures w-11 shrink-0 text-sm leading-[1.375rem] text-ink-2">
                    {t.plannedStart}
                    {t.plannedMinutes && (
                      <span className="block text-2xs leading-4 text-ink-3">{formatDuration(t.plannedMinutes * 60)}</span>
                    )}
                  </span>
                }
              />
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Anytime" className="mt-7">
        <h3 className="border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">
          {timed.length > 0 ? "Anytime" : "Plan"}
        </h3>
        <ul>
          {anytime.map((t) => (
            <TaskRow key={t.id} task={t} variant="day" />
          ))}
        </ul>
        <div className="border-b border-rule">
          <InlineAdd day={day} placeholder="Add a task, e.g. Read ch. 3 #italian 14:00 45m" />
        </div>
      </section>

      <TimeLog day={day} entries={entries.filter((e) => e.day === day)} tasks={dayTasks} sections={sections} />
    </div>
  );
}
