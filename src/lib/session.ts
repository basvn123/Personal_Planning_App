import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "ppos_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365;
/** A session older than this is re-signed on the next visit, so regular use never signs you out. */
export const SESSION_RENEW_AFTER = 60 * 60 * 24 * 7;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (16+ characters)");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string, version: number) {
  return new SignJWT({ sub: userId, v: version })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Verified session claims, or null when the cookie is missing, forged or from before accounts existed. */
export async function readSessionClaims(token: string | undefined): Promise<{ userId: string; version: number } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || !UUID_RE.test(payload.sub)) return null;
    return { userId: payload.sub, version: typeof payload.v === "number" ? payload.v : 0 };
  } catch {
    return null;
  }
}

/** Signature check only (middleware): the user id, plus a fresh token when this one is due for renewal. */
export async function checkSession(
  token: string | undefined,
  now = Date.now(),
): Promise<{ userId: string; renewed: string | null } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || !UUID_RE.test(payload.sub)) return null;
    const version = typeof payload.v === "number" ? payload.v : 0;
    const age = now / 1000 - (payload.iat ?? 0);
    return {
      userId: payload.sub,
      renewed: age > SESSION_RENEW_AFTER ? await createSessionToken(payload.sub, version) : null,
    };
  } catch {
    return null;
  }
}
