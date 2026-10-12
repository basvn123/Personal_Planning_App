"use client";

import { InlineAdd } from "@/components/planner/inline-add";
import { usePlanner } from "@/components/planner/planner-context";
import { TaskRow } from "@/components/planner/task-row";
import { formatDay } from "@/lib/time";

/** Section backlog plus what is already planned from it. */
export function SectionTasks({ sectionId }: { sectionId: string }) {
  const { tasks, today } = usePlanner();
  const backlog = tasks.filter((t) => t.plannedDate === null);
  const open = backlog.filter((t) => t.status !== "done");
  const done = backlog.filter((t) => t.status === "done");
  const planned = tasks.filter((t) => t.plannedDate !== null && t.plannedDate >= today);

  return (
    <>
      <Block title="Backlog" count={open.length}>
        <ul>
          {open.map((t) => (
            <TaskRow key={t.id} task={t} variant="week" />
          ))}
        </ul>
        <InlineAdd day={null} sectionId={sectionId} compact placeholder="Add to backlog" />
        {done.length > 0 && (
          <details className="group mt-1">
            <summary className="cursor-pointer list-none py-1 text-xs text-ink-3 hover:text-ink-2">
              {done.length} done
            </summary>
            <ul>
              {done.map((t) => (
                <TaskRow key={t.id} task={t} variant="week" />
              ))}
            </ul>
          </details>
        )}
      </Block>

      {planned.length > 0 && (
        <Block title="Planned" count={planned.length}>
          <ul>
            {planned.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                variant="week"
                lead={
                  <span className="figures w-14 shrink-0 text-xs leading-5 text-ink-3">
                    {t.plannedDate === today ? "Today" : formatDay(t.plannedDate!, "EEE d")}
                  </span>
                }
              />
            ))}
          </ul>
        </Block>
      )}
    </>
  );
}

function Block({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="mt-8">
      <div className="flex h-8 items-center justify-between border-b border-rule-strong">
        <h2 className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{title}</h2>
        <span className="figures text-xs text-ink-3">{count}</span>
      </div>
      <div className="pt-1.5">{children}</div>
    </section>
  );
}
