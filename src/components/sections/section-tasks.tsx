"use client";

import { InlineAdd } from "@/components/planner/inline-add";
import { usePlanner } from "@/components/planner/planner-context";
import { TaskRow } from "@/components/planner/task-row";
import { formatDay } from "@/lib/time";
import { CalendarClock, Inbox, Plus } from "lucide-react";
import { Card, CardAddButton } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useUi } from "@/lib/ui-store";

/** Section backlog plus what is already planned from it. */
export function SectionTasks({ sectionId }: { sectionId: string }) {
  const { tasks, today } = usePlanner();
  const openAdd = useUi((s) => s.openAdd);
  const backlog = tasks.filter((t) => t.plannedDate === null);
  const open = backlog.filter((t) => t.status !== "done");
  const done = backlog.filter((t) => t.status === "done");
  const planned = tasks.filter((t) => t.plannedDate !== null && t.plannedDate >= today);

  return (
    <>
      <Card
        icon={Inbox}
        title="To-do"
        count={open.length}
        action={<CardAddButton label="To-do toevoegen" onClick={() => openAdd({ day: null, sectionId })} />}
      >
        {open.length > 0 ? (
          <ul>
            {open.map((t) => (
              <TaskRow key={t.id} task={t} variant="week" />
            ))}
          </ul>
        ) : (
          <EmptyState icon={Inbox} text="Wat ooit moet, zonder dag. Plan het later in met de kalenderknop." className="lg:hidden" />
        )}
        <div className="max-lg:hidden">
          <InlineAdd day={null} sectionId={sectionId} compact placeholder="To-do toevoegen" />
        </div>
        <button
          type="button"
          onClick={() => openAdd({ day: null, sectionId })}
          className="mt-1 flex h-11 w-full items-center gap-2 rounded-lg px-1 text-sm font-medium text-[var(--link)] active:bg-paper-3 lg:hidden"
        >
          <Plus className="size-4" strokeWidth={2.25} />
          To-do toevoegen
        </button>
        {done.length > 0 && (
          <details className="group mt-1">
            <summary className="flex h-10 cursor-pointer list-none items-center text-xs text-ink-3 hover:text-ink-2 lg:h-8">
              {done.length} klaar
            </summary>
            <ul>
              {done.map((t) => (
                <TaskRow key={t.id} task={t} variant="week" />
              ))}
            </ul>
          </details>
        )}
      </Card>

      {planned.length > 0 && (
        <Card icon={CalendarClock} title="Ingepland" count={planned.length}>
          <ul>
            {planned.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                variant="week"
                lead={
                  <span className="figures w-14 shrink-0 text-xs leading-5 text-ink-3">
                    {t.plannedDate === today ? "Vandaag" : formatDay(t.plannedDate!, "EEEEEE d")}
                  </span>
                }
              />
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
