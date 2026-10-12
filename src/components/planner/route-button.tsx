"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { inputClass } from "@/components/ui/button";
import { formatDay, shiftDay } from "@/lib/time";
import { cx } from "@/lib/cx";
import { usePlanner } from "./planner-context";

/** Sends a backlog task to a day. */
export function RouteButton({ taskId, title, className }: { taskId: string; title: string; className?: string }) {
  const { today, patch } = usePlanner();
  const [open, setOpen] = useState(false);
  const days = Array.from({ length: 14 }, (_, i) => shiftDay(today, i));

  function send(day: string) {
    patch(taskId, { plannedDate: day });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Plan ${title}`}
        title="Plan on a day"
        onClick={(e) => e.stopPropagation()}
        className={cx(
          "grid size-7 shrink-0 place-items-center rounded-xs text-ink-3 transition-colors hover:bg-paper-3 hover:text-ink",
          className,
        )}
      >
        <CalendarPlus className="size-3.5" strokeWidth={1.75} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[17rem]">
        <div className="mb-2 flex gap-1">
          <Quick onClick={() => send(today)}>Today</Quick>
          <Quick onClick={() => send(shiftDay(today, 1))}>Tomorrow</Quick>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => send(d)}
              aria-label={formatDay(d, "EEEE d MMMM")}
              className={cx(
                "flex h-11 flex-col items-center justify-center rounded-xs leading-none transition-colors hover:bg-ribbon-wash",
                d === today ? "text-ribbon-ink" : "text-ink",
              )}
            >
              <span className="text-[0.625rem] uppercase tracking-[0.06em] text-ink-3">{formatDay(d, "EEEEE")}</span>
              <span className="figures mt-1 text-sm">{formatDay(d, "d")}</span>
            </button>
          ))}
        </div>
        <input
          type="date"
          aria-label="Pick a date"
          min={today}
          onChange={(e) => e.target.value && send(e.target.value)}
          className={cx(inputClass, "figures mt-2")}
        />
      </PopoverContent>
    </Popover>
  );
}

function Quick({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 flex-1 rounded-sm bg-paper-3 text-sm text-ink transition-colors hover:bg-ribbon-wash"
    >
      {children}
    </button>
  );
}
