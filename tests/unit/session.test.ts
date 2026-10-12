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

describe("session renewal", async () => {
  const { checkSession, SESSION_RENEW_AFTER } = await import("@/lib/session");
  const id = "6f1c2a7e-3b9d-4c1e-9a8b-0d2e4f6a8b1c";
  it("keeps a fresh token as is", async () => {
    const s = await checkSession(await createSessionToken(id, 2));
    expect(s).toEqual({ userId: id, renewed: null });
  });
  it("re-signs an older token with the same claims", async () => {
    const later = Date.now() + (SESSION_RENEW_AFTER + 60) * 1000;
    const s = await checkSession(await createSessionToken(id, 2), later);
    expect(s?.renewed).toBeTruthy();
    expect(await readSessionClaims(s!.renewed!)).toEqual({ userId: id, version: 2 });
  });
  it("rejects a forged token", async () => {
    expect(await checkSession("nope")).toBeNull();
  });
});
