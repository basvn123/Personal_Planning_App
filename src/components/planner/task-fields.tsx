"use client";

import { CalendarRange, X } from "lucide-react";
import { dyeVars } from "@/lib/dyes";
import { useEffect, useState } from "react";
import { clockToMinutes, endClock, formatDay, formatMinutes, shiftDay } from "@/lib/time";
import { cx } from "@/lib/cx";

/**
 * The same pickers everywhere a task gets its section, day, time and duration:
 * the add sheet, the task editor and the schedule form. Big targets on a phone,
 * compact on the desktop.
 */

export const DURATIONS = [15, 30, 45, 60, 90, 120, 180];

type Section = { id: string; name: string; color: string };

export function FieldGroup({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className={cx("flex flex-col gap-1.5", className)}>
      <span className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{label}</span>
      {children}
    </div>
  );
}

const chip = "inline-flex items-center justify-center rounded-sm font-medium transition-colors h-10 text-sm lg:h-8 lg:text-xs";

export function Chip({
  on,
  onClick,
  disabled,
  className,
  children,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        chip,
        "px-3 disabled:opacity-40",
        on ? "bg-cloth text-cloth-ink" : "bg-paper-3 text-ink-2 hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SectionChips({
  sections,
  value,
  onChange,
  disabled,
}: {
  sections: Section[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          aria-pressed={s.id === value}
          disabled={disabled}
          onClick={() => onChange(s.id)}
          style={dyeVars(s.color)}
          className={cx(
            chip,
            "px-3 disabled:opacity-40",
            s.id === value
              ? "bg-[var(--dye)] text-ink shadow-[inset_0_0_0_1.5px_var(--dye-deep)]"
              : "bg-[color-mix(in_oklch,var(--dye)_30%,var(--paper))] text-ink-2",
          )}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}

/** Today, tomorrow, the to-do list, or any other date. `null` is the to-do list. */
export function DayChips({
  value,
  onChange,
  today,
  disabled,
  multi,
  onMulti,
}: {
  value: string | null;
  onChange: (day: string | null) => void;
  today: string;
  disabled?: boolean;
  /** When set, a "Meerdere dagen" chip is offered; `multi` says it is chosen. */
  multi?: boolean;
  onMulti?: () => void;
}) {
  const tomorrow = shiftDay(today, 1);
  // While several days are chosen, none of the single-day chips is.
  const current = multi ? "" : value;
  const other = current !== null && current !== "" && current !== today && current !== tomorrow;
  return (
    <div className="flex flex-wrap gap-1.5">
      <Chip on={current === today} disabled={disabled} onClick={() => onChange(today)}>
        Vandaag
      </Chip>
      <Chip on={current === tomorrow} disabled={disabled} onClick={() => onChange(tomorrow)}>
        Morgen
      </Chip>
      <label
        className={cx(
          chip,
          "relative px-3",
          other ? "bg-cloth text-cloth-ink" : "bg-paper-3 text-ink-2 hover:text-ink",
          disabled && "pointer-events-none opacity-40",
        )}
      >
        <span className="first-letter:uppercase">{other ? formatDay(current!, "EEEEEE d MMM") : "Andere dag"}</span>
        <input
          type="date"
          value={current ?? ""}
          disabled={disabled}
          aria-label="Andere dag"
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <Chip on={current === null} disabled={disabled} onClick={() => onChange(null)}>
        To-do
      </Chip>
      {onMulti && (
        <Chip on={Boolean(multi)} disabled={disabled} onClick={onMulti}>
          <CalendarRange className="mr-1.5 size-4 lg:size-3.5" strokeWidth={1.75} />
          Meerdere dagen
        </Chip>
      )}
    </div>
  );
}

export function DurationChips({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (minutes: number | null) => void;
  disabled?: boolean;
}) {
  const options = value && !DURATIONS.includes(value) ? [...DURATIONS, value].sort((a, b) => a - b) : DURATIONS;
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
      {options.map((m) => (
        <Chip key={m} on={value === m} disabled={disabled} onClick={() => onChange(value === m ? null : m)} className="figures px-1">
          {formatMinutes(m)}
        </Chip>
      ))}
    </div>
  );
}

const timeInput =
  "figures h-10 w-32 rounded-sm border border-rule-strong bg-paper px-2.5 text-base text-ink outline-none focus:border-cloth-3 disabled:opacity-40 lg:h-8";

/**
 * From and until, as two native time pickers (the wheel on iOS). The until time is
 * not stored: it is the start plus the duration, so picking it sets the duration
 * and picking a duration chip moves it. Clearing the start goes back to "no fixed time".
 */
export function TimeRangeField({
  start,
  minutes,
  onStart,
  onMinutes,
  disabled,
}: {
  start: string;
  minutes: number | null;
  onStart: (time: string) => void;
  onMinutes: (minutes: number | null) => void;
  disabled?: boolean;
}) {
  const derived = start && minutes ? endClock(start, minutes) : "";
  const [end, setEnd] = useState(derived);
  const [late, setLate] = useState(false);
  useEffect(() => {
    setEnd(derived);
    setLate(false);
  }, [derived]);

  function pickEnd(value: string) {
    setEnd(value);
    if (!value || !start) return;
    const span = clockToMinutes(value) - clockToMinutes(start);
    setLate(span <= 0);
    if (span > 0) onMinutes(span);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <input
          type="time"
          value={start}
          disabled={disabled}
          onChange={(e) => onStart(e.target.value)}
          aria-label="Van"
          className={timeInput}
        />
        <span className="text-sm text-ink-3">tot</span>
        <input
          type="time"
          value={end}
          disabled={disabled || !start}
          onChange={(e) => pickEnd(e.target.value)}
          aria-label="Tot"
          aria-invalid={late || undefined}
          className={cx(timeInput, late && "border-danger")}
        />
        {start && (
          <button
            type="button"
            onClick={() => onStart("")}
            disabled={disabled}
            className="inline-flex h-10 items-center gap-1 rounded-sm px-2.5 text-sm text-ink-2 hover:bg-paper-3 hover:text-ink lg:h-8 lg:text-xs"
          >
            <X className="size-3.5" strokeWidth={2} />
            Geen tijd
          </button>
        )}
      </div>
      <span className={cx("text-xs", late ? "text-danger" : "text-ink-3")} aria-live="polite">
        {late
          ? "De eindtijd moet na de begintijd liggen."
          : !start
            ? "Geen vaste tijd. Kies een begintijd om ook een eindtijd te zetten."
            : minutes
              ? `${start} tot ${derived}, ${formatMinutes(minutes)}`
              : "Kies een eindtijd of een duur."}
      </span>
    </div>
  );
}
