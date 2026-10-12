import { describe, expect, it } from "vitest";
import { zonedClock, zonedInstant } from "@/lib/zoned";

describe("zoned", () => {
  it("converts local wall time to UTC across DST", () => {
    expect(zonedInstant("2026-07-01", "09:00", "Europe/Brussels").toISOString()).toBe("2026-07-01T07:00:00.000Z");
    expect(zonedInstant("2026-12-01", "09:00", "Europe/Brussels").toISOString()).toBe("2026-12-01T08:00:00.000Z");
  });
  it("round-trips clock time", () => {
    const i = zonedInstant("2026-10-25", "14:30", "Europe/Brussels");
    expect(zonedClock(i, "Europe/Brussels")).toBe("14:30");
  });
});
