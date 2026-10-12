import { describe, expect, it } from "vitest";
import { formatClock, formatDuration, localDate, shiftDay, weekDays } from "@/lib/time";
import { rankBetween, ranksAfter } from "@/lib/rank";
import { slugify } from "@/lib/slug";

describe("time", () => {
  it("formats durations as h:mm", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(5400)).toBe("1:30");
    expect(formatDuration(36000 + 59)).toBe("10:01");
  });
  it("formats a running clock", () => {
    expect(formatClock(3725)).toBe("1:02:05");
  });
  it("builds a Monday-first week", () => {
    const days = weekDays("2026-10-14", 1);
    expect(days[0]).toBe("2026-10-12");
    expect(days[6]).toBe("2026-10-18");
  });
  it("builds a Sunday-first week", () => {
    expect(weekDays("2026-10-14", 0)[0]).toBe("2026-10-11");
  });
  it("shifts across month and DST boundaries", () => {
    expect(shiftDay("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDay("2026-03-29", -7)).toBe("2026-03-22");
  });
  it("resolves the local date in a timezone", () => {
    const instant = new Date("2026-10-12T22:30:00Z");
    expect(localDate(instant, "Europe/Brussels")).toBe("2026-10-13");
    expect(localDate(instant, "America/New_York")).toBe("2026-10-12");
  });
});

describe("rank", () => {
  it("inserts between neighbours", () => {
    const [a, b] = ranksAfter(null, 2);
    const mid = rankBetween(a, b);
    expect(a < mid && mid < b).toBe(true);
  });
});

describe("slugify", () => {
  it("normalises names", () => {
    expect(slugify("Cloud Skills")).toBe("cloud-skills");
    expect(slugify("Café Italiano!")).toBe("cafe-italiano");
    expect(slugify("***")).toBe("section");
  });
});
