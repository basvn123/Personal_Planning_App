import { shiftDay } from "./time";

export type Pace = {
  percent: number;
  remaining: number;
  perWeek: number;
  eta: string | null; // projected finish date
  needPerWeek: number | null; // to hit the due date
  onTrack: boolean | null;
  complete: boolean;
};

/**
 * Momentum from the last four weeks of progress (or since the first log when
 * younger), projected forward to a finish date and checked against the due date.
 */
export function pace(
  p: { targetUnits: number; done: number; last28: number; dueDate: string | null; firstLog: string | null },
  today: string,
): Pace {
  const remaining = Math.max(0, p.targetUnits - p.done);
  const percent = p.targetUnits > 0 ? Math.min(100, (p.done / p.targetUnits) * 100) : 0;
  const complete = remaining === 0;
  let weeks = 4;
  if (p.firstLog) {
    const age = (Date.parse(today) - Date.parse(p.firstLog)) / 86_400_000 + 1;
    weeks = Math.min(4, Math.max(1, age / 7));
  }
  const perWeek = p.last28 / weeks;
  const eta = complete ? today : perWeek > 0 ? shiftDay(today, Math.ceil((remaining / perWeek) * 7)) : null;
  let needPerWeek: number | null = null;
  let onTrack: boolean | null = null;
  if (p.dueDate && !complete) {
    const daysLeft = (Date.parse(p.dueDate) - Date.parse(today)) / 86_400_000;
    needPerWeek = daysLeft > 0 ? remaining / (daysLeft / 7) : remaining;
    onTrack = eta !== null && eta <= p.dueDate;
  }
  return { percent, remaining, perWeek, eta, needPerWeek, onTrack, complete };
}
