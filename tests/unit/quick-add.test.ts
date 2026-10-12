import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "@/lib/quick-add";

const sections = [
  { id: "it", name: "Italian", slug: "italian" },
  { id: "cs", name: "Cloud Skills", slug: "cloud-skills" },
  { id: "w", name: "Work", slug: "work" },
];
const today = "2026-10-12"; // Monday

describe("parseQuickAdd", () => {
  it("extracts section, date, time and duration", () => {
    const r = parseQuickAdd("Read chapter 3 #italian tomorrow 14:00 45m", today, sections);
    expect(r).toEqual({
      title: "Read chapter 3",
      sectionId: "it",
      plannedDate: "2026-10-13",
      plannedStart: "14:00",
      plannedMinutes: 45,
    });
  });
  it("matches multi-word and prefix section names", () => {
    expect(parseQuickAdd("Lab #cloud skills", today, sections).sectionId).toBe("cs");
    expect(parseQuickAdd("Lab #cloud-skills", today, sections).sectionId).toBe("cs");
    expect(parseQuickAdd("Mail #wo", today, sections).sectionId).toBe("w");
  });
  it("keeps unknown hashtags in the title", () => {
    expect(parseQuickAdd("Fix #42 bug", today, sections).title).toBe("Fix #42 bug");
  });
  it("resolves weekdays to the next occurrence", () => {
    expect(parseQuickAdd("Swim fri", today, sections).plannedDate).toBe("2026-10-16");
    expect(parseQuickAdd("Swim monday", today, sections).plannedDate).toBe("2026-10-19");
  });
  it("parses day/month and rolls into next year when past", () => {
    expect(parseQuickAdd("Exam 20/12", today, sections).plannedDate).toBe("2026-12-20");
    expect(parseQuickAdd("Exam 3/1", today, sections).plannedDate).toBe("2027-01-03");
  });
  it("parses durations and am/pm", () => {
    expect(parseQuickAdd("Run 1h30 7am", today, sections)).toMatchObject({ plannedMinutes: 90, plannedStart: "07:00" });
    expect(parseQuickAdd("Call 2h 2pm", today, sections)).toMatchObject({ plannedMinutes: 120, plannedStart: "14:00" });
  });
  it("leaves plain numbers in the title", () => {
    expect(parseQuickAdd("Read 30 pages", today, sections)).toMatchObject({ title: "Read 30 pages", plannedMinutes: null });
  });
  it("supports backlog", () => {
    expect(parseQuickAdd("Idea backlog", today, sections).plannedDate).toBeNull();
    expect(parseQuickAdd("Idea", today, sections).plannedDate).toBeUndefined();
  });
});
