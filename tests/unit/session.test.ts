import { describe, expect, it } from "vitest";
process.env.SESSION_SECRET = "test-secret-test-secret-test-secret";
const { createSessionToken, readSessionClaims } = await import("@/lib/session");

describe("session", () => {
  it("round-trips user id and version", async () => {
    const id = "6f1c2a7e-3b9d-4c1e-9a8b-0d2e4f6a8b1c";
    const t = await createSessionToken(id, 3);
    expect(await readSessionClaims(t)).toEqual({ userId: id, version: 3 });
  });
  it("rejects tampered and legacy tokens", async () => {
    const t = await createSessionToken("6f1c2a7e-3b9d-4c1e-9a8b-0d2e4f6a8b1c", 1);
    expect(await readSessionClaims(t.slice(0, -2) + "xx")).toBeNull();
    expect(await readSessionClaims(undefined)).toBeNull();
  });
});
