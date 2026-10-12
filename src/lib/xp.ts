/** Points for finishing things and for time actually spent. */
export const XP_PER_TASK = 10;
/** One point per six logged minutes: 10 per hour. */
export const MINUTES_PER_XP = 6;
/** Extra points per day of the current streak, capped so a long streak stays a bonus. */
export const XP_PER_STREAK_DAY = 5;
export const STREAK_BONUS_CAP = 30;

const TITLES = ["Starter", "Op gang", "Op dreef", "Doorzetter", "Volhouder", "Planner", "Vakman", "Kampioen", "Meester", "Legende"];

export function xpFrom({ tasksDone, secondsLogged }: { tasksDone: number; secondsLogged: number }) {
  return tasksDone * XP_PER_TASK + Math.floor(secondsLogged / 60 / MINUTES_PER_XP);
}

export function streakBonus(streakDays: number) {
  return Math.min(streakDays, STREAK_BONUS_CAP) * XP_PER_STREAK_DAY;
}

/** Points needed to go from `level` to the next one: 100, 150, 200, ... */
export function levelCost(level: number) {
  return 50 + level * 50;
}

export type Level = { level: number; title: string; into: number; need: number; percent: number };

export function levelFor(xp: number): Level {
  let level = 1;
  let left = Math.max(0, Math.floor(xp));
  while (left >= levelCost(level)) {
    left -= levelCost(level);
    level++;
  }
  const need = levelCost(level);
  return {
    level,
    title: TITLES[Math.min(level - 1, TITLES.length - 1)],
    into: left,
    need,
    percent: Math.round((left / need) * 100),
  };
}
