"use client";

import { useDroppable } from "@dnd-kit/core";
import { formatDay, formatDuration } from "@/lib/time";
import { cx } from "@/lib/cx";
import { Ribbon } from "./ribbon";
import { InlineAdd } from "./inline-add";
import { sortDay, usePlanner } from "./planner-context";
import { TaskRow } from "./task-row";

export function WeekList({ days, logged }: { days: string[]; logged: Record<string, number> }) {
  const { tasks, today, selectedDay, selectDay } = usePlanner();
  const todayIndex = days.indexOf(today);
  const isThisWeek = todayIndex >= 0;

  return (
    <ol className="flex flex-1 flex-col border-t border-rule-strong">
      {days.map((day, i) => {
        const isToday = day === today;
        const isSelected = day === selectedDay;
        const dayTasks = sortDay(tasks.filter((t) => t.plannedDate === day));
        const planned = dayTasks.reduce((s, t) => s + (t.plannedMinutes ?? 0) * 60, 0);
        const spent = logged[day] ?? 0;
        return (
          <DayRow
            key={day}
            day={day}
            className={cx(
              "group/day relative grid min-h-[4.75rem] flex-1 grid-cols-[3.25rem_1fr_3.25rem] gap-x-3 border-b border-rule px-5 py-2.5 pr-11 lg:px-8 lg:pr-14",
              i >= 5 && "bg-paper-2/50",
              isToday && "bg-ribbon-wash/55",
            )}
            isToday={isToday}
          >
            {isThisWeek && i < todayIndex && <Ribbon kind="through" />}
            {isToday && <Ribbon kind="tail" />}
            <button
              type="button"
              onClick={() => selectDay(day)}
              aria-pressed={isSelected}
              aria-label={`Open ${formatDay(day, "EEEE d MMMM")}`}
              className="-m-1 flex flex-col self-start rounded-xs p-1 text-left leading-none transition-colors hover:bg-paper-3/70"
            >
              <span
                className={cx(
                  "text-2xs font-medium uppercase tracking-[0.08em]",
                  isToday ? "text-ribbon-ink" : "text-ink-3",
                )}
              >
                {formatDay(day, "EEE")}
              </span>
              <span
                className={cx(
                  "figures mt-1 text-xl font-medium",
                  isSelected ? "text-ink underline decoration-ribbon-2 decoration-2 underline-offset-[5px]" : "text-ink",
                )}
              >
                {formatDay(day, "d")}
              </span>
            </button>
            <ul className="min-w-0">
              {dayTasks.map((t) => (
                <TaskRow key={t.id} task={t} variant="week" />
              ))}
              <li
                className={cx(
                  "transition-opacity duration-150 lg:opacity-0 lg:group-hover/day:opacity-100 lg:focus-within:opacity-100",
                  dayTasks.length === 0 && "lg:opacity-60",
                )}
              >
                <InlineAdd day={day} compact placeholder="Add" />
              </li>
            </ul>
            <DayMeter planned={planned} logged={spent} />
          </DayRow>
        );
      })}
    </ol>
  );
}

/** Logged time against planned time for one day, in the page margin. */
function DayMeter({ planned, logged }: { planned: number; logged: number }) {
  const max = Math.max(planned, logged, 1);
  return (
    <div className="flex flex-col items-end gap-1 pt-0.5" title={`Logged ${formatDuration(logged)} of ${formatDuration(planned)} planned`}>
      <span className={cx("figures text-sm leading-none", logged > 0 ? "text-ink-2" : "text-ink-3")}>{formatDuration(logged)}</span>
      {planned > 0 && (
        <>
          <span className="figures text-2xs leading-none text-ink-3">/ {formatDuration(planned)}</span>
          <span className="relative mt-0.5 h-[3px] w-10 overflow-hidden rounded-full bg-rule">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-cloth-3"
              style={{ width: `${Math.min(100, (logged / max) * 100)}%` }}
            />
          </span>
        </>
      )}
    </div>
  );
}

function DayRow({
  day,
  isToday,
  className,
  children,
}: {
  day: string;
  isToday: boolean;
  className: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${day}` });
  return (
    <li
      ref={setNodeRef}
      aria-current={isToday ? "date" : undefined}
      className={cx(className, isOver && "bg-ribbon-wash shadow-[inset_0_0_0_1.5px_var(--ribbon-2)]")}
    >
      {children}
    </li>
  );
}
