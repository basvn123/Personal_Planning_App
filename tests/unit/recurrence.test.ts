import { describe, expect, it } from "vitest";
import { buildRule, describeRule, occurrences, parseRule } from "@/lib/recurrence";

describe("recurrence", () => {
  const rule = buildRule({ start: "2026-10-12", until: null, interval: 1, days: ["MO", "TH"] });

  it("round-trips", () => {
    expect(parseRule(rule)).toEqual({ start: "2026-10-12", until: null, interval: 1, days: ["MO", "TH"] });
  });
  it("lists occurrences in range", () => {
    expect(occurrences(rule, "2026-10-10", "2026-10-25")).toEqual(["2026-10-12", "2026-10-15", "2026-10-19", "2026-10-22"]);
  });
  it("never fires before the start date", () => {
    expect(occurrences(rule, "2026-10-01", "2026-10-11")).toEqual([]);
  });
  it("honours interval and until", () => {
    const r = buildRule({ start: "2026-10-12", until: "2026-11-10", interval: 2, days: ["MO"] });
    expect(occurrences(r, "2026-10-01", "2026-12-31")).toEqual(["2026-10-12", "2026-10-26", "2026-11-09"]);
  });
  it("describes rules", () => {
    expect(describeRule(parseRule(rule))).toBe("Mon, Thu");
    expect(describeRule({ start: "2026-01-01", until: null, interval: 1, days: ["MO", "TU", "WE", "TH", "FR"] })).toBe("Weekdays");
  });
});
