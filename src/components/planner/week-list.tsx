"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { formatDay, formatDuration } from "@/lib/time";
import { cx } from "@/lib/cx";
import { InlineAdd } from "./inline-add";
import { sortDay, usePlanner } from "./planner-context";
import { TaskRow } from "./task-row";

/** The week as seven day cards: a date badge, that day's tasks, and its time meter. */
export function WeekList({ days, logged }: { days: string[]; logged: Record<string, number> }) {
  const { tasks, today, selectedDay, selectDay } = usePlanner();
  const openAdd = useUi((s) => s.openAdd);

  return (
    <ol className="flex flex-col gap-2 lg:gap-3">
      {days.map((day) => {
        const isToday = day === today;
        const isSelected = day === selectedDay;
        const dayTasks = sortDay(tasks.filter((t) => t.plannedDate === day));
        const planned = dayTasks.reduce((s, t) => s + (t.plannedMinutes ?? 0) * 60, 0);
        const done = dayTasks.filter((t) => t.status === "done").length;
        const spent = logged[day] ?? 0;
        return (
          <DayRow
            key={day}
            day={day}
            className={cx(
              "group/day relative grid grid-cols-[3rem_1fr_auto] gap-x-3 overflow-hidden rounded-xl border bg-card px-3 py-3 shadow-[0_1px_2px_oklch(0.2_0.02_258/0.04)] sm:px-4",
              isToday ? "border-ribbon-2/60" : "border-rule",
            )}
            isToday={isToday}
          >
            {/* Marigold means now: today's card carries it on its edge. */}
            {isToday && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-ribbon" />}
            <button
              type="button"
              onClick={() => selectDay(day)}
              aria-pressed={isSelected}
              aria-label={`${formatDay(day, "EEEE d MMMM")} openen`}
              className={cx(
                "flex size-12 flex-col items-center justify-center self-start rounded-lg leading-none transition-colors",
                isSelected ? "bg-cloth text-cloth-ink" : "bg-canvas text-ink hover:bg-paper-3",
              )}
            >
              <span
                className={cx(
                  "text-2xs font-medium uppercase tracking-[0.06em]",
                  isSelected ? "text-cloth-ink-2" : isToday ? "text-ribbon-ink" : "text-ink-3",
                )}
              >
                {formatDay(day, "EEEEEE")}
              </span>
              <span className="figures mt-1 text-lg font-semibold">{formatDay(day, "d")}</span>
            </button>
            <div className="min-w-0">
              <div className="flex min-h-6 items-center gap-2">
                {isToday && (
                  <span className="rounded-full bg-ribbon-wash px-2 py-px text-2xs font-semibold uppercase tracking-[0.06em] text-ribbon-ink">
                    Vandaag
                  </span>
                )}
                {dayTasks.length > 0 ? (
                  <span className={cx("figures text-xs", done === dayTasks.length ? "font-medium text-[var(--link)]" : "text-ink-3")}>
                    {done}/{dayTasks.length} klaar
                  </span>
                ) : (
                  <span className="text-xs text-ink-3">Nog niets gepland</span>
                )}
              </div>
              <ul className="min-w-0">
                {dayTasks.map((t) => (
                  <TaskRow key={t.id} task={t} variant="week" />
                ))}
                <li
                  className={cx(
                    "transition-opacity duration-150 max-lg:hidden lg:opacity-0 lg:group-hover/day:opacity-100 lg:focus-within:opacity-100",
                    dayTasks.length === 0 && "lg:opacity-60",
                  )}
                >
                  <InlineAdd day={day} compact placeholder="Toevoegen" />
                </li>
                <li className="lg:hidden">
                  <button
                    type="button"
                    onClick={() => openAdd({ day })}
                    className="-ml-1 mt-0.5 inline-flex h-10 items-center gap-1.5 rounded-lg px-1.5 text-sm font-medium text-[var(--link)] active:bg-paper-3"
                  >
                    <Plus className="size-4" strokeWidth={2.25} />
                    Toevoegen
                  </button>
                </li>
              </ul>
            </div>
            <DayMeter planned={planned} logged={spent} />
          </DayRow>
        );
      })}
    </ol>
  );
}

/** Logged time against planned time for one day, in the card's right margin. */
function DayMeter({ planned, logged }: { planned: number; logged: number }) {
  const max = Math.max(planned, logged, 1);
  return (
    <div className="flex flex-col items-end gap-1 pt-0.5" title={`${formatDuration(logged)} gelogd van ${formatDuration(planned)} gepland`}>
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
      className={cx(className, isOver && "bg-ribbon-wash ring-2 ring-ribbon-2")}
    >
      {children}
    </li>
  );
}
