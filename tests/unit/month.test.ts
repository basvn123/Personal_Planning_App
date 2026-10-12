import { describe, expect, it } from "vitest";
import { monthGrid, shiftMonth } from "@/lib/time";

describe("month helpers", () => {
  it("moves by months across years", () => {
    expect(shiftMonth("2026-10-12", 1)).toBe("2026-11-01");
    expect(shiftMonth("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftMonth("2026-01-15", -1)).toBe("2025-12-01");
    expect(shiftMonth("2026-10-12", 0)).toBe("2026-10-01");
  });
  it("lays out six weeks starting on the week start", () => {
    const g = monthGrid("2026-11-20", 1);
    expect(g).toHaveLength(42);
    expect(g[0]).toBe("2026-10-26"); // Monday before 1 November (a Sunday)
    expect(g).toContain("2026-11-30");
    const s = monthGrid("2026-11-20", 0);
    expect(s[0]).toBe("2026-11-01"); // 1 November is a Sunday
  });
});
