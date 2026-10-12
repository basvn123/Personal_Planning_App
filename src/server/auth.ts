import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { readSession, SESSION_COOKIE } from "@/lib/session";

/** The signed-in person for this request. Cached so every query in a render shares one lookup. */
export const currentUser = cache(async () => {
  const id = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, hasPassword: users.passwordHash })
    .from(users)
    .where(eq(users.id, id));
  return user ? { ...user, hasPassword: Boolean(user.hasPassword) } : null;
});

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
