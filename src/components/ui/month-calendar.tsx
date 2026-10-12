"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDay, monthGrid, shiftMonth } from "@/lib/time";
import { cx } from "@/lib/cx";

/**
 * A month the way any agenda shows one: flip months with the arrows, tap a day.
 * Used to jump to a far week (one tap) and to pick several days for a task
 * (taps toggle). `highlight` shades a range, such as the week in view.
 */
export function MonthCalendar({
  start,
  today,
  weekStart = 1,
  selected = [],
  highlight = [],
  onPick,
  label = "Kalender",
}: {
  /** Any day in the month to open on. */
  start: string;
  today: string;
  weekStart?: 0 | 1;
  selected?: string[];
  highlight?: string[];
  onPick: (day: string) => void;
  label?: string;
}) {
  const [month, setMonth] = useState(() => shiftMonth(start, 0));
  const days = monthGrid(month, weekStart);
  const inMonth = month.slice(0, 7);
  const picked = new Set(selected);
  const shaded = new Set(highlight);

  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Vorige maand"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-paper-3 lg:size-8"
        >
          <ChevronLeft className="size-5 lg:size-4" strokeWidth={1.75} />
        </button>
        <span className="flex-1 text-center text-base font-semibold text-ink first-letter:uppercase" aria-live="polite">
          {formatDay(month, "LLLL yyyy")}
        </span>
        <button
          type="button"
          aria-label="Volgende maand"
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-paper-3 lg:size-8"
        >
          <ChevronRight className="size-5 lg:size-4" strokeWidth={1.75} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {days.slice(0, 7).map((d) => (
          <span key={`head-${d}`} className="pb-1 text-2xs font-medium uppercase tracking-[0.06em] text-ink-3">
            {formatDay(d, "EEEEEE")}
          </span>
        ))}
        {days.map((d, i) => {
          const on = picked.has(d);
          const other = d.slice(0, 7) !== inMonth;
          const isToday = d === today;
          return (
            <span
              key={d}
              className={cx(
                "flex justify-center",
                shaded.has(d) && "bg-paper-3",
                shaded.has(d) && (i % 7 === 0 || !shaded.has(days[i - 1])) && "rounded-l-full",
                shaded.has(d) && (i % 7 === 6 || !shaded.has(days[i + 1])) && "rounded-r-full",
              )}
            >
              <button
                type="button"
                aria-pressed={on}
                aria-label={formatDay(d, "EEEE d MMMM yyyy")}
                onClick={() => onPick(d)}
                className={cx(
                  "figures relative grid size-10 place-items-center rounded-full text-sm transition-colors lg:size-9",
                  on ? "bg-cloth font-semibold text-cloth-ink" : other ? "text-ink-3/70 hover:bg-paper-3" : "text-ink hover:bg-paper-3",
                  isToday && !on && "font-semibold text-ribbon-ink ring-2 ring-inset ring-ribbon",
                )}
              >
                {formatDay(d, "d")}
              </button>
            </span>
          );
        })}
      </div>
      {month.slice(0, 7) !== today.slice(0, 7) && (
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(today, 0))}
          className="self-center rounded-full px-3 py-1.5 text-sm font-medium text-[var(--link)] hover:bg-paper-3"
        >
          Naar deze maand
        </button>
      )}
    </div>
  );
}
