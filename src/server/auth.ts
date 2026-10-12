import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createSessionToken, readSessionClaims, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

/** The signed-in person for this request. Cached so every query in a render shares one lookup. */
export const currentUser = cache(async () => {
  const claims = await readSessionClaims((await cookies()).get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      hasPassword: users.passwordHash,
      sessionVersion: users.sessionVersion,
    })
    .from(users)
    .where(eq(users.id, claims.userId));
  // A password change bumps the version, which signs out every older session.
  if (!user || user.sessionVersion !== claims.version) return null;
  return { ...user, hasPassword: Boolean(user.hasPassword) };
});

/** For route handlers: the user id when the session is valid and not revoked. */
export async function sessionUserId(): Promise<string | null> {
  return (await currentUser())?.id ?? null;
}

export async function setSessionCookie(userId: string, version: number) {
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(userId, version), sessionCookieOptions);
}

/**
 * Every query and action scopes its data to this id. A missing or deleted
 * account sends the request back to the sign-in page.
 */
export async function requireUserId(): Promise<string> {
  const user = await currentUser();
  if (!user) redirect("/unlock");
  return user.id;
}

export async function requireOwner() {
  const user = await currentUser();
  if (!user) redirect("/unlock");
  if (user.role !== "owner") throw new Error("Only the owner can do this.");
  return user;
}
