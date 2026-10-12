"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { PlannerTask } from "@/server/queries/tasks";
import { dyeVars } from "@/lib/dyes";
import { createTask, deleteTask, setTaskStatus, updateTask, type TaskPatch } from "@/server/actions/tasks";
import { deleteSchedule } from "@/server/actions/schedules";
import { useUi } from "@/lib/ui-store";
import { XP_PER_TASK } from "@/lib/xp";

export type PlannerSection = { id: string; name: string; slug: string; color: string };
export type PlannerProject = { id: string; name: string; sectionId: string; unitLabel: string };

type Ctx = {
  tasks: PlannerTask[];
  sections: PlannerSection[];
  projects: PlannerProject[];
  today: string;
  selectedDay: string;
  selectDay: (day: string) => void;
  add: (input: {
    title: string;
    sectionId: string;
    plannedDate: string | null;
    plannedStart: string | null;
    plannedMinutes: number | null;
  }) => void;
  patch: (id: string, patch: TaskPatch) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  /** Deletes a whole schedule: its upcoming open occurrences leave the planner. */
  removeSeries: (scheduleId: string, fromTaskId: string) => void;
  error: string | null;
  pending: boolean;
};

const PlannerCtx = createContext<Ctx | null>(null);

export function usePlanner() {
  const ctx = useContext(PlannerCtx);
  if (!ctx) throw new Error("usePlanner outside PlannerProvider");
  return ctx;
}

export function PlannerProvider({
  initialTasks,
  sections,
  projects = [],
  today,
  initialDay,
  scope,
  children,
}: {
  initialTasks: PlannerTask[];
  sections: PlannerSection[];
  projects?: PlannerProject[];
  today: string;
  initialDay: string;
  /**
   * Which new tasks this page shows, so the add sheet can add them here at once:
   * the week page holds its seven days plus every to-do, a section page its own
   * to-do and what is planned from today on.
   */
  scope: { days: string[] } | { sectionId: string };
  children: React.ReactNode;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Fresh server data replaces local state after every revalidation.
  useEffect(() => setTasks(initialTasks), [initialTasks]);
  useEffect(() => setSelectedDay(initialDay), [initialDay]);

  const selectDay = useCallback((day: string) => {
    setSelectedDay(day);
    const url = new URL(window.location.href);
    url.searchParams.set("day", day);
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new CustomEvent("spread:show", { detail: "right" }));
  }, []);

  const run = useCallback((optimistic: (ts: PlannerTask[]) => PlannerTask[], action: () => Promise<unknown>) => {
    setError(null);
    let snapshot: PlannerTask[] = [];
    setTasks((ts) => {
      snapshot = ts;
      return optimistic(ts);
    });
    start(async () => {
      try {
        await action();
      } catch {
        setTasks(snapshot);
        setError("Niet opgeslagen. Probeer opnieuw.");
      }
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      tasks,
      sections,
      projects,
      today,
      selectedDay,
      selectDay,
      pending,
      error,
      add: (input) => {
        const section = sections.find((s) => s.id === input.sectionId)!;
        const temp: PlannerTask = {
          id: `temp-${crypto.randomUUID()}`,
          title: input.title,
          notesMd: "",
          status: "todo",
          plannedDate: input.plannedDate,
          plannedStart: input.plannedStart,
          plannedMinutes: input.plannedMinutes,
          units: null,
          rank: "~",
          projectId: null,
          scheduleId: null,
          section,
          loggedSeconds: 0,
          docs: [],
        };
        run((ts) => [...ts, temp], () => createTask(input));
        useUi.getState().showToast("Toegevoegd");
      },
      patch: (id, p) => {
        run(
          (ts) =>
            ts.map((t) =>
              t.id === id
                ? {
                    ...t,
                    ...(p.title !== undefined && { title: p.title }),
                    ...(p.notesMd !== undefined && { notesMd: p.notesMd }),
                    ...(p.plannedDate !== undefined && { plannedDate: p.plannedDate }),
                    ...(p.plannedStart !== undefined && { plannedStart: p.plannedStart }),
                    ...(p.plannedMinutes !== undefined && { plannedMinutes: p.plannedMinutes }),
                    ...(p.units !== undefined && { units: p.units }),
                    ...(p.projectId !== undefined && { projectId: p.projectId }),
                    ...(p.sectionId !== undefined && {
                      section: sections.find((s) => s.id === p.sectionId) ?? t.section,
                    }),
                  }
                : t,
            ),
          () => updateTask(id, p),
        );
      },
      toggle: (id) => {
        const t = tasks.find((x) => x.id === id);
        if (!t || id.startsWith("temp-")) return;
        const next = t.status === "done" ? "todo" : "done";
        const ui = useUi.getState();
        ui.gainXp(next === "done" ? XP_PER_TASK : -XP_PER_TASK);
        if (next === "done") ui.showToast(`+${XP_PER_TASK} XP`);
        run((ts) => ts.map((x) => (x.id === id ? { ...x, status: next } : x)), () => setTaskStatus(id, next));
      },
      remove: (id) => {
        run((ts) => ts.filter((t) => t.id !== id), () => deleteTask(id));
        useUi.getState().showToast("Verwijderd");
      },
      removeSeries: (scheduleId, fromTaskId) => {
        const open = (t: PlannerTask) => t.status !== "done" && t.loggedSeconds === 0;
        const upcoming = (t: PlannerTask) =>
          t.scheduleId === scheduleId && t.status === "todo" && t.loggedSeconds === 0 && t.plannedDate !== null && t.plannedDate >= today;
        const from = tasks.find((t) => t.id === fromTaskId);
        // The tapped occurrence goes too when it is still open, even if it lies in the past.
        const dropFrom = Boolean(from && open(from) && !upcoming(from));
        run(
          (ts) => ts.filter((t) => !upcoming(t) && !(dropFrom && t.id === fromTaskId)),
          async () => {
            await deleteSchedule(scheduleId);
            if (dropFrom) await deleteTask(fromTaskId);
          },
        );
      },
    }),
    [tasks, sections, projects, today, selectedDay, selectDay, pending, error, run],
  );

  // Offer the add sheet an instant add for tasks that belong on this page.
  const latest = useRef({ value, scope });
  latest.current = { value, scope };
  useEffect(() => {
    const { setPlanner } = useUi.getState();
    setPlanner({
      day: selectedDay,
      sectionId: "sectionId" in scope ? scope.sectionId : null,
      add: (task) => {
        const { value: v, scope: sc } = latest.current;
        const fits =
          "days" in sc
            ? task.plannedDate === null || sc.days.includes(task.plannedDate)
            : task.sectionId === sc.sectionId && (task.plannedDate === null || task.plannedDate >= v.today);
        if (!fits || !v.sections.some((s) => s.id === task.sectionId)) return false;
        v.add(task);
        return true;
      },
    });
    return () => useUi.getState().setPlanner(null);
  }, [selectedDay, scope]);

  return (
    <PlannerCtx.Provider value={value}>
      <PlannerDnd tasks={tasks} onDrop={(id, day) => value.patch(id, { plannedDate: day })}>
        {children}
      </PlannerDnd>
    </PlannerCtx.Provider>
  );
}

/** Drag a task onto any day row ("day:YYYY-MM-DD") to plan it there. */
function PlannerDnd({
  tasks,
  onDrop,
  children,
}: {
  tasks: PlannerTask[];
  onDrop: (taskId: string, day: string) => void;
  children: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 280, tolerance: 6 } }),
  );
  const active = tasks.find((t) => t.id === activeId);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const over = e.over?.id ? String(e.over.id) : "";
    if (!over.startsWith("day:")) return;
    const day = over.slice(4);
    const task = tasks.find((t) => t.id === e.active.id);
    if (task && task.plannedDate !== day) onDrop(task.id, day);
  }

  return (
    <DndContext id="planner" sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      {children}
      <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
        {active && (
          <div
            style={dyeVars(active.section.color)}
            className="flex max-w-72 items-center gap-2 rounded-sm border border-rule bg-paper px-2.5 py-1.5 text-sm text-ink shadow-lift"
          >
            <span className="size-2.5 shrink-0 rounded-[2px] bg-[var(--dye)]" />
            <span className="truncate">{active.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

/** Sort for one day: timed tasks by start, then the rest by rank. */
export function sortDay(tasks: PlannerTask[]) {
  return [...tasks].sort((a, b) => {
    if (a.plannedStart && b.plannedStart) return a.plannedStart.localeCompare(b.plannedStart);
    if (a.plannedStart) return -1;
    if (b.plannedStart) return 1;
    return a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0;
  });
}
