"use client";

import { formatDay, formatDuration } from "@/lib/time";
import { cx } from "@/lib/cx";
import { TipArea, useTip } from "./tip";

export type DayDatum = { day: string; seconds: number; plannedSeconds: number; done: number; total: number };

/** Logged hours per day, with the planned amount as an outline behind each bar. */
export function DailyBars({ data, today }: { data: DayDatum[]; today: string }) {
  const max = Math.max(3600, ...data.map((d) => Math.max(d.seconds, d.plannedSeconds)));
  const peak = data.reduce((a, b) => (b.seconds > a.seconds ? b : a), data[0]);
  return (
    <TipArea>
      <div className="grid h-44 grid-cols-7 items-end gap-2 border-b border-rule-strong">
        {data.map((d) => (
          <Bar key={d.day} d={d} max={max} isToday={d.day === today} label={d === peak && d.seconds > 0} />
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-2">
        {data.map((d) => (
          <span
            key={d.day}
            className={cx("text-center text-2xs uppercase tracking-[0.06em]", d.day === today ? "text-ribbon-ink" : "text-ink-3")}
          >
            {formatDay(d.day, "EEE")}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Logged and planned hours per day</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Logged</th>
            <th>Planned</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{formatDay(d.day, "EEEE d MMMM")}</td>
              <td>{formatDuration(d.seconds)}</td>
              <td>{formatDuration(d.plannedSeconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TipArea>
  );
}

function Bar({ d, max, isToday, label }: { d: DayDatum; max: number; isToday: boolean; label: boolean }) {
  const tip = useTip(
    <span className="flex flex-col gap-0.5">
      <span className="font-medium">{formatDay(d.day, "EEEE d MMM")}</span>
      <span className="figures">Logged {formatDuration(d.seconds)}</span>
      {d.plannedSeconds > 0 && <span className="figures">Planned {formatDuration(d.plannedSeconds)}</span>}
      {d.total > 0 && (
        <span className="figures">
          {d.done}/{d.total} tasks done
        </span>
      )}
    </span>,
  );
  const h = (d.seconds / max) * 100;
  const p = (d.plannedSeconds / max) * 100;
  return (
    <div {...tip} aria-label={`${formatDay(d.day, "EEEE")}: ${formatDuration(d.seconds)} logged`} className="relative flex h-full items-end justify-center outline-none">
      {d.plannedSeconds > 0 && (
        <span
          aria-hidden
          className="absolute bottom-0 w-[min(2.5rem,80%)] rounded-t-[4px] border border-b-0 border-dashed border-rule-strong"
          style={{ height: `${p}%` }}
        />
      )}
      <span
        aria-hidden
        className={cx(
          "relative w-[min(2.5rem,80%)] rounded-t-[4px] transition-[height] duration-500 ease-out",
          isToday ? "bg-ribbon-2" : "bg-[var(--bar)]",
        )}
        style={{ height: `${Math.max(d.seconds > 0 ? 1.5 : 0, h)}%` }}
      >
        {label && (
          <span className="figures absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-ink-2">{formatDuration(d.seconds)}</span>
        )}
      </span>
    </div>
  );
}
