"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Clock, ListTodo, Plus } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { formatDay, formatDuration, formatMinutes, shiftDay } from "@/lib/time";
import { useUi } from "@/lib/ui-store";
import { cx } from "@/lib/cx";
import { InlineAdd } from "./inline-add";
import { sortDay, usePlanner } from "./planner-context";
import { TaskRow } from "./task-row";
import { DayStrip } from "./day-strip";
import { TimeLog } from "@/components/timer/time-log";
import { BacklogTray } from "./backlog-tray";
import { Card, CardAddButton } from "@/components/ui/card";
import { EmptyAction, EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { pageBody } from "@/components/ui/page-body";
import { XpLine } from "@/components/progress/xp-meter";
import { WeekJump } from "@/components/ui/week-jump";
import type { XpSummary } from "@/server/queries/xp";
import type { LogEntry } from "@/server/queries/time";
import type { PlannerTask } from "@/server/queries/tasks";

function toMinutes(clock: string) {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
}

function clockOf(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Minutes since local midnight, refreshed every half minute. */
function useMinuteOfDay() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function DayPlan({
  days,
  logged,
  entries,
  xp,
}: {
  days: string[];
  logged: Record<string, number>;
  entries: LogEntry[];
  xp: XpSummary;
}) {
  const router = useRouter();
  const openAdd = useUi((s) => s.openAdd);
  const { tasks, sections, today, selectedDay, selectDay, error } = usePlanner();
  const day = selectedDay;
  const dayTasks = sortDay(tasks.filter((t) => t.plannedDate === day));
  const timed = dayTasks.filter((t) => t.plannedStart);
  const anytime = dayTasks.filter((t) => !t.plannedStart);
  const planned = dayTasks.reduce((s, t) => s + (t.plannedMinutes ?? 0) * 60, 0);
  const done = dayTasks.filter((t) => t.status === "done").length;
  const now = useMinuteOfDay();

  function go(offset: number) {
    const next = shiftDay(day, offset);
    if (days.includes(next)) selectDay(next);
    else router.push(`/week?d=${next}&day=${next}`);
  }

  // A sensible first guess for "something at a set time": the next whole hour today, nine o'clock otherwise.
  const suggestTime = () => {
    if (day !== today || now === null) return "09:00";
    const next = Math.min(23, Math.floor(now / 60) + 1);
    return `${String(next).padStart(2, "0")}:00`;
  };

  const label = day === today ? "Vandaag" : day === shiftDay(today, 1) ? "Morgen" : day === shiftDay(today, -1) ? "Gisteren" : null;

  return (
    <div className={pageBody}>
      <Card bodyClassName="flex flex-col gap-3 pt-3">
        <DayStrip days={days} />
        <PageHeader
          as="h2"
          title={
            <>
              <span className="lg:hidden">{formatDay(day, "EEEE d MMM")}</span>
              <span className="max-lg:hidden">{formatDay(day, "EEEE d MMMM")}</span>
            </>
          }
          info="day"
          subtitle={
            <>
              {label && <span className="font-medium text-ribbon-ink">{label}</span>}
              {dayTasks.length > 0 && (
                <span className="figures">
                  {done}/{dayTasks.length} klaar
                </span>
              )}
              {planned > 0 && <span className="figures">{formatDuration(planned)} gepland</span>}
              <span className="figures">{formatDuration(logged[day] ?? 0)} gelogd</span>
            </>
          }
          actions={
            <>
              <WeekJump
                target="week"
                current={day}
                days={days}
                today={today}
                weekStart={new Date(`${days[0]}T12:00:00Z`).getUTCDay() === 0 ? 0 : 1}
                onPick={(d) => {
                  if (!days.includes(d)) return false;
                  selectDay(d);
                  return true;
                }}
              />
              {/* Phone: the strip switches days and the calendar reaches any week, so the arrows are desktop only. */}
              <IconButton label="Vorige dag" onClick={() => go(-1)} className="rounded-full max-lg:hidden">
                <ChevronLeft className="size-5 lg:size-4" strokeWidth={1.75} />
              </IconButton>
              <IconButton label="Volgende dag" onClick={() => go(1)} className="rounded-full max-lg:hidden">
                <ChevronRight className="size-5 lg:size-4" strokeWidth={1.75} />
              </IconButton>
            </>
          }
          className="px-0"
        />
        {dayTasks.length > 0 && (
          <div
            role="progressbar"
            aria-label="Klaar"
            aria-valuemin={0}
            aria-valuemax={dayTasks.length}
            aria-valuenow={done}
            className="h-2 overflow-hidden rounded-full bg-paper-3"
          >
            <div
              className="h-full rounded-full bg-cloth-3 transition-[width] duration-500 ease-out"
              style={{ width: `${(done / dayTasks.length) * 100}%` }}
            />
          </div>
        )}
        <XpLine xp={xp} />
      </Card>

      {error && (
        <p role="alert" className="rounded-xl bg-danger-wash px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <Card
        icon={Clock}
        title="Op tijd"
        count={timed.length}
        action={<CardAddButton label="Iets op een vast uur toevoegen" onClick={() => openAdd({ day, time: suggestTime() })} />}
      >
        {timed.length > 0 ? (
          <Agenda tasks={timed} now={day === today ? now : null} />
        ) : (
          <EmptyState
            icon={CalendarClock}
            text="Lessen, sport en afspraken met een uur komen hier op een tijdlijn."
            action={<EmptyAction onClick={() => openAdd({ day, time: suggestTime() })}>Inplannen op een uur</EmptyAction>}
          />
        )}
      </Card>

      <Card
        icon={ListTodo}
        title="Zonder tijd"
        count={anytime.length}
        action={<CardAddButton label="Taak zonder uur toevoegen" onClick={() => openAdd({ day })} />}
      >
        {anytime.length > 0 ? (
          <ul>
            {anytime.map((t) => (
              <TaskRow key={t.id} task={t} variant="day" lead={<DurationLead task={t} />} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={ListTodo} text="Wat vandaag moet, maar niet op een vast uur." className="lg:hidden" />
        )}
        <div className="border-t border-rule max-lg:hidden">
          <InlineAdd day={day} placeholder="Taak toevoegen, bv. Hoofdstuk 3 lezen #italian 14:00 45m" />
        </div>
        <button
          type="button"
          onClick={() => openAdd({ day })}
          className="mt-1 flex h-11 w-full items-center gap-2 rounded-lg px-1 text-sm font-medium text-[var(--link)] active:bg-paper-3 lg:hidden"
        >
          <Plus className="size-4" strokeWidth={2.25} />
          Toevoegen op {formatDay(day, "EEEEEE d MMM")}
        </button>
      </Card>

      <BacklogTray />

      <TimeLog day={day} entries={entries.filter((e) => e.day === day)} tasks={dayTasks} sections={sections} />
    </div>
  );
}

/**
 * Timed tasks on a time line: each block is as tall as it is long, open time
 * between blocks is printed, and on today a "now" mark sits where the clock is.
 */
function Agenda({ tasks, now }: { tasks: PlannerTask[]; now: number | null }) {
  const nowIndex = now === null ? -1 : tasks.findIndex((t) => toMinutes(t.plannedStart!) > now);
  const nowAt = now === null ? -1 : nowIndex === -1 ? tasks.length : nowIndex;
  return (
    <ul>
      {tasks.map((t, i) => {
        const start = toMinutes(t.plannedStart!);
        const prev = tasks[i - 1];
        const prevEnd = prev ? toMinutes(prev.plannedStart!) + (prev.plannedMinutes ?? 0) : null;
        const free = prevEnd !== null ? start - prevEnd : 0;
        const overlap = prevEnd !== null && start < prevEnd;
        return (
          <Fragment key={t.id}>
            {i === nowAt && now !== null && <NowMark now={now} />}
            {free >= 15 && (
              <li aria-hidden className="flex items-center gap-2 py-1 pl-14 text-2xs text-ink-3">
                <span className="h-px flex-1 border-t border-dashed border-rule-strong" />
                <span className="figures">{formatMinutes(free)} vrij</span>
                <span className="h-px w-6 border-t border-dashed border-rule-strong" />
              </li>
            )}
            <TaskRow
              task={t}
              variant="day"
              lead={<TimeLead task={t} overlap={overlap} />}
            />
          </Fragment>
        );
      })}
      {nowAt === tasks.length && now !== null && tasks.length > 0 && <NowMark now={now} />}
    </ul>
  );
}

function NowMark({ now }: { now: number }) {
  return (
    <li aria-label={`Nu ${clockOf(now)}`} className="relative flex items-center gap-2 py-1">
      <span className="figures w-11 shrink-0 text-2xs font-medium text-ribbon-ink">{clockOf(now)}</span>
      <span className="size-2 shrink-0 rounded-full bg-ribbon" />
      <span className="h-[2px] flex-1 rounded-full bg-ribbon" />
    </li>
  );
}

/** Start time, end time, and a bar in the section's color that grows with the duration. */
function TimeLead({ task, overlap }: { task: PlannerTask; overlap: boolean }) {
  const start = toMinutes(task.plannedStart!);
  const minutes = task.plannedMinutes ?? 0;
  const bar = Math.min(84, Math.max(14, minutes * 0.6));
  return (
    <span className="flex w-11 shrink-0 flex-col items-start">
      <span className={cx("figures text-sm leading-[1.375rem]", overlap ? "text-danger" : "text-ink")} title={overlap ? "Overlapt met de vorige" : undefined}>
        {task.plannedStart!.slice(0, 5)}
      </span>
      {minutes > 0 && (
        <>
          <span aria-hidden className="ml-1 mt-0.5 w-[3px] rounded-full bg-[var(--dye)]" style={{ height: bar }} />
          <span className="figures mt-0.5 text-2xs leading-4 text-ink-3">{clockOf((start + minutes) % 1440)}</span>
        </>
      )}
    </span>
  );
}

function DurationLead({ task }: { task: PlannerTask }) {
  return (
    <span className="figures w-11 shrink-0 text-xs leading-[1.375rem] text-ink-3">
      {task.plannedMinutes ? formatMinutes(task.plannedMinutes) : ""}
    </span>
  );
}
