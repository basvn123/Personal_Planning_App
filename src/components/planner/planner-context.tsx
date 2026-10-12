"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";
import type { PlannerTask } from "@/server/queries/tasks";
import { createTask, deleteTask, setTaskStatus, updateTask, type TaskPatch } from "@/server/actions/tasks";

export type PlannerSection = { id: string; name: string; slug: string; color: string };

type Ctx = {
  tasks: PlannerTask[];
  sections: PlannerSection[];
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
  today,
  initialDay,
  children,
}: {
  initialTasks: PlannerTask[];
  sections: PlannerSection[];
  today: string;
  initialDay: string;
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
        setError("Change not saved. Try again.");
      }
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      tasks,
      sections,
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
        run((ts) => ts.map((x) => (x.id === id ? { ...x, status: next } : x)), () => setTaskStatus(id, next));
      },
      remove: (id) => {
        run((ts) => ts.filter((t) => t.id !== id), () => deleteTask(id));
      },
    }),
    [tasks, sections, today, selectedDay, selectDay, pending, error, run],
  );

  return <PlannerCtx.Provider value={value}>{children}</PlannerCtx.Provider>;
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
