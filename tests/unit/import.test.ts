import { describe, expect, it } from "vitest";
import { buildRows, guessMapping, parseDate, parseDuration, parseTime, parseWeekday } from "@/lib/import-parse";

describe("import parsing", () => {
  it("parses dates", () => {
    expect(parseDate("2026-10-12")).toBe("2026-10-12");
    expect(parseDate("12/10/2026")).toBe("2026-10-12");
    expect(parseDate("12.10.26")).toBe("2026-10-12");
    expect(parseDate("10/12/2026", "mdy")).toBe("2026-10-12");
    expect(parseDate("31/02/2026")).toBeNull();
  });
  it("parses times and durations", () => {
    expect(parseTime("7:00")).toBe("07:00");
    expect(parseTime("6pm")).toBe("18:00");
    expect(parseTime("0730")).toBe("07:30");
    expect(parseDuration("45")).toBe(45);
    expect(parseDuration("1h30")).toBe(90);
    expect(parseDuration("1:15")).toBe(75);
    expect(parseDuration("1.5h")).toBe(90);
    expect(parseDuration("90 min")).toBe(90);
    expect(parseDuration("easy")).toBeNull();
  });
  it("parses weekdays in several languages", () => {
    expect(parseWeekday("Mon")).toBe(0);
    expect(parseWeekday("zondag")).toBe(6);
    expect(parseWeekday("giovedì")).toBe(3);
  });
  it("guesses columns", () => {
    const m = guessMapping(["Week", "Day", "Session", "Duration", "Sport", "Notes"]);
    expect(m).toMatchObject({ week: "Week", weekday: "Day", title: "Session", duration: "Duration", section: "Sport", notes: "Notes", date: null });
  });
  it("lays out a week-based training plan from a start date", () => {
    const records = [
      { Week: "1", Day: "Mon", Session: "Swim 2km", Duration: "45", Sport: "Swim" },
      { Week: "1", Day: "Sun", Session: "Long ride", Duration: "3h", Sport: "Bike" },
      { Week: "2", Day: "Wed", Session: "Intervals", Duration: "1:00", Sport: "Run" },
      { Week: "x", Day: "Wed", Session: "Bad", Duration: "", Sport: "" },
    ];
    const { rows, issues } = buildRows(records, guessMapping(Object.keys(records[0])), { planStart: "2026-10-14" });
    expect(rows.map((r) => [r.date, r.minutes, r.sectionName])).toEqual([
      ["2026-10-12", 45, "Swim"],
      ["2026-10-18", 180, "Bike"],
      ["2026-10-21", 60, "Run"],
    ]);
    expect(issues).toEqual([{ line: 5, message: 'Unreadable week "x"' }]);
  });
});
