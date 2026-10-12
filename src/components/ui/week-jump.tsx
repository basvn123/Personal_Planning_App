"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, usePhone } from "@/components/ui/sheet";
import { MonthCalendar } from "@/components/ui/month-calendar";
import { cx } from "@/lib/cx";

/**
 * The calendar button between the week arrows: opens a month, flip to any
 * month, tap a day to go straight there. A sheet on the phone, a popover on
 * the desktop.
 */
export function WeekJump({
  target,
  current,
  days = [],
  today,
  weekStart = 1,
  onPick,
  className,
}: {
  /** Where a picked day leads: the planner on that day, or progress for that week. */
  target: "week" | "dashboard";
  /** The day in view; the calendar opens on its month. */
  current: string;
  /** The week in view, shaded in the calendar. */
  days?: string[];
  today: string;
  weekStart?: 0 | 1;
  /** Handle a pick in place (say, a day of the week already on screen); return true when done. */
  onPick?: (day: string) => boolean;
  className?: string;
}) {
  const router = useRouter();
  const phone = usePhone();
  const [open, setOpen] = useState(false);

  function pick(day: string) {
    setOpen(false);
    if (onPick?.(day)) return;
    router.push(target === "week" ? `/week?d=${day}&day=${day}` : `/dashboard?w=${day}`);
  }

  const calendar = (
    <MonthCalendar
      key={current}
      start={current}
      today={today}
      weekStart={weekStart}
      selected={target === "week" ? [current] : []}
      highlight={days}
      onPick={pick}
      label="Ga naar een dag"
    />
  );
  const trigger = cx(
    "grid size-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink active:bg-paper-3 data-[state=open]:bg-paper-3 lg:size-8",
    className,
  );

  if (phone) {
    return (
      <>
        <button type="button" aria-label="Kies een dag in de kalender" title="Kalender" onClick={() => setOpen(true)} className={trigger}>
          <CalendarDays className="size-5 lg:size-4" strokeWidth={1.75} />
        </button>
        <Sheet open={open} onOpenChange={setOpen} title="Ga naar een dag">
          <div className="pb-2">{calendar}</div>
        </Sheet>
      </>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger aria-label="Kies een dag in de kalender" title="Kalender" className={trigger}>
        <CalendarDays className="size-5 lg:size-4" strokeWidth={1.75} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[19rem] p-3">
        {calendar}
      </PopoverContent>
    </Popover>
  );
}
