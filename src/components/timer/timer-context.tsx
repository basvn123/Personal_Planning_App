"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";
import type { RunningTimer } from "@/server/queries/time";
import { startTimer, stopTimer } from "@/server/actions/time";

type TimerCtx = {
  running: RunningTimer | null;
  start: (target: { task?: { id: string; title: string }; section: RunningTimer["section"] }) => void;
  stop: () => void;
  pending: boolean;
};

const Ctx = createContext<TimerCtx | null>(null);

export function useTimer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTimer outside TimerProvider");
  return ctx;
}

export function TimerProvider({ initial, children }: { initial: RunningTimer | null; children: React.ReactNode }) {
  const router = useRouter();
  const [running, setRunning] = useState(initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => setRunning(initial), [initial]);

  // Another device may start or stop the timer; re-sync when the tab comes back.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  const start = useCallback<TimerCtx["start"]>(({ task, section }) => {
    const previous = running;
    setRunning({ id: "pending", startedAt: new Date().toISOString(), task: task ?? null, section });
    startTransition(async () => {
      try {
        await startTimer(task ? { taskId: task.id } : { sectionId: section.id });
      } catch {
        setRunning(previous);
      }
    });
  }, [running]);

  const stop = useCallback(() => {
    const previous = running;
    setRunning(null);
    startTransition(async () => {
      try {
        await stopTimer();
      } catch {
        setRunning(previous);
      }
    });
  }, [running]);

  const value = useMemo(() => ({ running, start, stop, pending }), [running, start, stop, pending]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Seconds since an ISO instant, ticking once a second while mounted. */
export function useElapsed(since: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [since]);
  return since ? Math.max(0, (now - new Date(since).getTime()) / 1000) : 0;
}
