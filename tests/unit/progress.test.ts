import { describe, expect, it } from "vitest";
import { pace } from "@/lib/progress";

describe("pace", () => {
  const today = "2026-10-12";
  it("projects a finish date from recent momentum", () => {
    const r = pace({ targetUnits: 200, done: 50, last28: 40, dueDate: null, firstLog: "2026-01-01" }, today);
    expect(r.percent).toBe(25);
    expect(r.perWeek).toBe(10);
    expect(r.eta).toBe("2027-01-25"); // 150 left at 10/week = 15 weeks
  });
  it("judges the due date", () => {
    const r = pace({ targetUnits: 100, done: 90, last28: 8, dueDate: "2026-11-30", firstLog: "2026-01-01" }, today);
    expect(r.onTrack).toBe(true);
    const late = pace({ targetUnits: 100, done: 10, last28: 4, dueDate: "2026-11-30", firstLog: "2026-01-01" }, today);
    expect(late.onTrack).toBe(false);
    expect(late.needPerWeek).toBeCloseTo(90 / 7, 5);
  });
  it("uses a shorter window for new projects", () => {
    const r = pace({ targetUnits: 20, done: 4, last28: 4, dueDate: null, firstLog: "2026-10-06" }, today);
    expect(r.perWeek).toBe(4);
  });
  it("has no eta without momentum", () => {
    expect(pace({ targetUnits: 10, done: 0, last28: 0, dueDate: null, firstLog: null }, today).eta).toBeNull();
  });
});
