/**
 * Pure helpers for "what am I doing now": which of today's tasks to offer first,
 * and how a running task compares with its plan. Going over the plan is normal,
 * so nothing here caps, throws or goes negative.
 */

export type Candidate = {
  id: string;
  status: string;
  plannedStart: string | null;
  plannedMinutes: number | null;
};

function startOf(t: Candidate): number | null {
  if (!t.plannedStart) return null;
  const [h, m] = t.plannedStart.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Open tasks in the order worth offering at minute `now` of the day: what is planned
 * for right now first, then what comes next, then tasks without a time, and last what
 * was planned earlier and is still open.
 */
export function orderForNow<T extends Candidate>(tasks: T[], now: number): T[] {
  const rank = (t: T): [number, number] => {
    const start = startOf(t);
    if (start === null) return [2, 0];
    const end = start + (t.plannedMinutes ?? 0);
    if (start <= now && now < Math.max(end, start + 1)) return [0, start];
    if (start > now) return [1, start];
    return [3, -start];
  };
  return tasks
    .filter((t) => t.status !== "done")
    .map((t, i) => ({ t, i, r: rank(t) }))
    .sort((a, b) => a.r[0] - b.r[0] || a.r[1] - b.r[1] || a.i - b.i)
    .map((x) => x.t);
}

/** Where a task stands against its plan. `over` is 0 until the plan is passed. */
export function planProgress(loggedSeconds: number, plannedMinutes: number | null | undefined) {
  const logged = Math.max(0, loggedSeconds);
  const planned = plannedMinutes && plannedMinutes > 0 ? plannedMinutes * 60 : 0;
  return {
    planned,
    logged,
    over: planned ? Math.max(0, logged - planned) : 0,
    /** 0..1 for a bar; stays at 1 once over. */
    fill: planned ? Math.min(1, logged / planned) : 0,
  };
}

/** The plan that covers what was logged, rounded up to a quarter hour. */
export function coveringMinutes(loggedSeconds: number, step = 15): number {
  return Math.max(step, Math.ceil(Math.max(0, loggedSeconds) / 60 / step) * step);
}
