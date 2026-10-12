"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import type { PlannerTask } from "@/server/queries/tasks";
import { formatDuration, formatMinutes } from "@/lib/time";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";
import { usePlanner } from "./planner-context";
import { TaskCheck } from "./task-check";
import { TaskEditor } from "./task-editor";

/** One task line. Compact in the week list, roomier in the day plan. */
export function TaskRow({
  task,
  variant,
  lead,
}: {
  task: PlannerTask;
  variant: "week" | "day";
  lead?: React.ReactNode;
}) {
  const { toggle } = usePlanner();
  const [open, setOpen] = useState(false);
  const done = task.status === "done";
  const temp = task.id.startsWith("temp-");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <li
          style={dyeVars(task.section.color)}
          className={cx(
            "group relative flex items-start gap-2.5",
            variant === "week" ? "py-[3px]" : "border-b border-rule py-2.5",
            temp && "opacity-60",
          )}
        >
          {lead}
          <span className="pt-[3px]">
            <TaskCheck
              done={done}
              color={task.section.color}
              onToggle={() => toggle(task.id)}
              label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
              size={variant === "week" ? "sm" : "md"}
            />
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cx(
              "min-w-0 flex-1 text-left outline-offset-1",
              variant === "week" ? "text-sm leading-5" : "text-base leading-[1.375rem]",
              done ? "text-ink-3" : "text-ink",
            )}
          >
            <span className={cx("[overflow-wrap:anywhere]", done && "line-through decoration-ink-3/60")}>{task.title}</span>
            {variant === "day" && (
              <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-ink-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-[2px] bg-[var(--dye)] ring-1 ring-[color-mix(in_oklch,var(--dye-deep)_35%,transparent)]" />
                  {task.section.name}
                </span>
                {task.docs.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <FileText className="size-3" strokeWidth={1.75} />
                    {task.docs.length}
                  </span>
                )}
                {task.loggedSeconds > 0 && <span className="figures">{formatDuration(task.loggedSeconds)} logged</span>}
              </span>
            )}
          </button>
          {variant === "week" && (task.plannedStart || task.plannedMinutes) && (
            <span className="figures shrink-0 pt-px text-xs leading-5 text-ink-3">
              {task.plannedStart ?? formatMinutes(task.plannedMinutes!)}
            </span>
          )}
          {variant === "week" && (
            <span
              aria-hidden
              className="absolute -left-2 top-[7px] h-3 w-[3px] rounded-[1px] bg-[var(--dye)] opacity-0 transition-opacity group-hover:opacity-100"
            />
          )}
        </li>
      </PopoverAnchor>
      <PopoverContent align="start" side="bottom" onOpenAutoFocus={(e) => e.preventDefault()}>
        <TaskEditor task={task} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
