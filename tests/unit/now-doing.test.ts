import { describe, expect, it } from "vitest";
import { coveringMinutes, orderForNow, planProgress } from "@/lib/now-doing";

const t = (id: string, plannedStart: string | null, plannedMinutes: number | null, status = "todo") => ({
  id,
  status,
  plannedStart,
  plannedMinutes,
});

describe("now doing", () => {
  it("offers what is planned for now first, then next, then untimed, then earlier", () => {
    const tasks = [t("early", "08:00", 30), t("untimed", null, 45), t("next", "15:00", 60), t("now", "13:30", 90), t("done", "13:00", 120, "done")];
    expect(orderForNow(tasks, 14 * 60).map((x) => x.id)).toEqual(["now", "next", "untimed", "early"]);
  });
  it("treats a timed task without a duration as current only at its start minute", () => {
    expect(orderForNow([t("a", "14:00", null)], 14 * 60)[0].id).toBe("a");
  });
  it("reports going over the plan without breaking", () => {
    expect(planProgress(5400, 60)).toEqual({ planned: 3600, logged: 5400, over: 1800, fill: 1 });
    expect(planProgress(1800, 60).over).toBe(0);
    expect(planProgress(1800, 60).fill).toBe(0.5);
    expect(planProgress(1800, null)).toEqual({ planned: 0, logged: 1800, over: 0, fill: 0 });
    expect(planProgress(-5, 0).logged).toBe(0);
  });
  it("rounds a new plan up to a quarter hour", () => {
    expect(coveringMinutes(5400)).toBe(90);
    expect(coveringMinutes(5401)).toBe(105);
    expect(coveringMinutes(0)).toBe(15);
  });
});
