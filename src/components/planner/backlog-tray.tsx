"use client";

import { useState } from "react";
import { ChevronDown, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";
import { usePlanner } from "./planner-context";
import { TaskRow } from "./task-row";

/** Open to-dos from every section, ready to drag onto a day or send with the calendar button. */
export function BacklogTray() {
  const { tasks, sections } = usePlanner();
  const [open, setOpen] = useState(false);
  const backlog = tasks.filter((t) => t.plannedDate === null && t.status !== "done");
  const done = tasks.filter((t) => t.plannedDate === null && t.status === "done");
  const groups = sections
    .map((s) => ({ section: s, items: backlog.filter((t) => t.section.id === s.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <Card
      icon={Inbox}
      title="To-do"
      count={backlog.length}
      meta={!open && backlog.length > 0 ? "uit al je secties" : undefined}
      action={
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "To-do inklappen" : "To-do openen"}
          className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-paper-3 lg:size-8"
        >
          <ChevronDown className={cx("size-5 transition-transform duration-200 lg:size-4", open && "rotate-180")} strokeWidth={2} />
        </button>
      }
    >
      {open &&
        (groups.length === 0 ? (
          <EmptyState icon={Inbox} text="Geen open to-do's. Zet ze in een sectie onder To-do, dan plan je ze hier in." />
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            {groups.map(({ section, items }) => (
              <div key={section.id} style={dyeVars(section.color)}>
                <h3 className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-2">
                  <span className="size-2 rounded-[2px] bg-[var(--dye)]" />
                  {section.name}
                </h3>
                <ul className="pl-3.5">
                  {items.map((t) => (
                    <TaskRow key={t.id} task={t} variant="week" />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      {open && done.length > 0 && (
        // Ticked to-dos stay findable here, and unticking brings them back.
        <details className="mt-2 border-t border-rule pt-1">
          <summary className="flex h-10 cursor-pointer list-none items-center text-xs text-ink-3 hover:text-ink-2 lg:h-8">
            {done.length} klaar, tik om terug te zetten
          </summary>
          <ul className="pl-3.5">
            {done.map((t) => (
              <TaskRow key={t.id} task={t} variant="week" />
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}
