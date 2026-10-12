import { describe, expect, it } from "vitest";
import { levelCost, levelFor, streakBonus, xpFrom } from "@/lib/xp";

describe("xp", () => {
  it("counts tasks and logged time", () => {
    expect(xpFrom({ tasksDone: 3, secondsLogged: 3600 })).toBe(40);
    expect(xpFrom({ tasksDone: 0, secondsLogged: 359 })).toBe(0);
  });
  it("caps the streak bonus", () => {
    expect(streakBonus(4)).toBe(20);
    expect(streakBonus(400)).toBe(150);
  });
  it("walks the level curve", () => {
    expect(levelFor(0)).toMatchObject({ level: 1, into: 0, need: 100, percent: 0 });
    expect(levelFor(99).level).toBe(1);
    expect(levelFor(100)).toMatchObject({ level: 2, into: 0, need: levelCost(2) });
    expect(levelFor(100 + 150 + 10)).toMatchObject({ level: 3, into: 10 });
    expect(levelFor(1e6).title).toBe("Legende");
  });
});
