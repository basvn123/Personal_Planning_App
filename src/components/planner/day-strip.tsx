"use client";

import { formatDay } from "@/lib/time";
import { cx } from "@/lib/cx";
import { usePlanner } from "./planner-context";

/**
 * The week as seven buttons above the day: how full each day is and how much
 * of it is done, one tap to switch. Phone only; the desktop has the week page beside it.
 */
export function DayStrip({ days }: { days: string[] }) {
  const { tasks, today, selectedDay, selectDay } = usePlanner();
  return (
    <div role="tablist" aria-label="Dagen" className="grid grid-cols-7 gap-1 lg:hidden">
      {days.map((day) => {
        const items = tasks.filter((t) => t.plannedDate === day);
        const done = items.filter((t) => t.status === "done").length;
        const selected = day === selectedDay;
        const isToday = day === today;
        return (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`${formatDay(day, "EEEE d MMMM")}, ${done} van ${items.length} klaar`}
            onClick={() => selectDay(day)}
            className={cx(
              "relative flex h-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-md transition-colors",
              selected ? "bg-cloth text-cloth-ink" : "bg-paper-2 text-ink active:bg-paper-3",
            )}
          >
            <span
              className={cx(
                "text-2xs font-medium uppercase tracking-[0.06em]",
                selected ? "text-cloth-ink-2" : isToday ? "text-ribbon-ink" : "text-ink-3",
              )}
            >
              {formatDay(day, "EEEEEE")}
            </span>
            <span className="figures text-md font-semibold leading-none">{formatDay(day, "d")}</span>
            {/* One pip per task, filled when done; a count when there are many. */}
            <span className="flex h-1.5 items-center gap-[3px]">
              {items.length > 0 && items.length <= 5 ? (
                items.map((t) => (
                  <span
                    key={t.id}
                    className={cx(
                      "size-1.5 rounded-full",
                      t.status === "done"
                        ? selected
                          ? "bg-cloth-ink"
                          : "bg-cloth-3"
                        : selected
                          ? "bg-cloth-ink/35"
                          : "bg-rule-strong",
                    )}
                  />
                ))
              ) : items.length > 5 ? (
                <span className={cx("figures text-[0.625rem] leading-none", selected ? "text-cloth-ink-2" : "text-ink-3")}>
                  {done}/{items.length}
                </span>
              ) : null}
            </span>
            {isToday && (
              <span aria-hidden className="absolute inset-x-3 -bottom-1 h-[3px] rounded-full bg-ribbon" />
            )}
          </button>
        );
      })}
    </div>
  );
}
