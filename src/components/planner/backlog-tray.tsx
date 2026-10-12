"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";
import { usePlanner } from "./planner-context";
import { TaskRow } from "./task-row";

/** Open backlog items from every section, ready to drag onto a day or send with the calendar button. */
export function BacklogTray() {
  const { tasks, sections } = usePlanner();
  const [open, setOpen] = useState(false);
  const backlog = tasks.filter((t) => t.plannedDate === null && t.status !== "done");
  const groups = sections
    .map((s) => ({ section: s, items: backlog.filter((t) => t.section.id === s.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <section aria-label="Backlog" className="mt-7">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-8 w-full items-center gap-1.5 border-b border-rule-strong text-left"
      >
        <ChevronRight className={cx("size-3.5 text-ink-3 transition-transform duration-200", open && "rotate-90")} strokeWidth={2} />
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">Backlog</span>
        <span className="figures ml-auto text-xs text-ink-3">{backlog.length}</span>
      </button>
      {open && (
        <div className="pt-1">
          {groups.length === 0 && <p className="py-3 text-sm text-ink-3">Every backlog is empty.</p>}
          {groups.map(({ section, items }) => (
            <div key={section.id} className="py-2" style={dyeVars(section.color)}>
              <h4 className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-2">
                <span className="size-2 rounded-[2px] bg-[var(--dye)]" />
                {section.name}
              </h4>
              <ul className="pl-3.5">
                {items.map((t) => (
                  <TaskRow key={t.id} task={t} variant="week" />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
