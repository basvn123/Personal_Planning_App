import { describe, expect, it } from "vitest";
import { buildCalendar } from "@/lib/ics";

describe("ics", () => {
  const cal = buildCalendar(
    [
      { uid: "a@p", title: "Swim, easy; 2km", date: "2026-10-15", start: "07:00", minutes: 90, updated: new Date("2026-10-01T00:00:00Z") },
      { uid: "b@p", title: "Gift", date: "2026-12-31", updated: new Date("2026-10-01T00:00:00Z"), description: "x".repeat(200) },
    ],
    "Europe/Brussels",
    "Planner",
  );
  it("writes timed events as UTC instants from the owner's timezone", () => {
    expect(cal).toContain("DTSTART:20261015T050000Z");
    expect(cal).toContain("DTEND:20261015T063000Z");
    expect(cal).toContain("SUMMARY:Swim\\, easy\; 2km");
  });
  it("writes all-day events that end the next day across a year boundary", () => {
    expect(cal).toContain("DTSTART;VALUE=DATE:20261231");
    expect(cal).toContain("DTEND;VALUE=DATE:20270101");
  });
  it("folds long lines and uses CRLF", () => {
    for (const line of cal.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(cal.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
