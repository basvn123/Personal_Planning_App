"use client";

import { formatDay, formatDuration } from "@/lib/time";
import { cx } from "@/lib/cx";
import { TipArea, useTip } from "./tip";

const STEPS = [0, 0.5 * 3600, 1.5 * 3600, 3 * 3600, 5 * 3600];

function level(seconds: number) {
  let l = 0;
  for (let i = 1; i < STEPS.length; i++) if (seconds >= STEPS[i]) l = i;
  return seconds > 0 ? Math.max(1, l) : 0;
}

/** Weeks as columns, Monday at the top. One hue, light to dark. */
export function Heatmap({ days, today }: { days: { day: string; seconds: number }[]; today: string }) {
  const weeks: { day: string; seconds: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return (
    <TipArea>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((w, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {w.map((d) => (
              <Cell key={d.day} d={d} isToday={d.day === today} future={d.day > today} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-2xs text-ink-3">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="size-2.5 rounded-[2px]" style={{ background: `var(--heat-${l})` }} />
        ))}
        <span>More</span>
      </div>
    </TipArea>
  );
}

function Cell({ d, isToday, future }: { d: { day: string; seconds: number }; isToday: boolean; future: boolean }) {
  const tip = useTip(
    <span className="figures">
      {formatDay(d.day, "EEE d MMM")}: {formatDuration(d.seconds)}
    </span>,
  );
  return (
    <span
      {...(future ? {} : tip)}
      aria-label={`${formatDay(d.day, "d MMM")}: ${formatDuration(d.seconds)}`}
      className={cx("size-3.5 rounded-[3px] outline-none", isToday && "ring-1 ring-ribbon-2 ring-offset-1 ring-offset-paper", future && "opacity-0")}
      style={{ background: `var(--heat-${level(d.seconds)})` }}
    />
  );
}
