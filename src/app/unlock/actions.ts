"use server";

import { timingSafeEqual } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

function sameText(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

async function findUserId(email: string, password: string): Promise<string | null> {
  if (email) {
    const [user] = await db
      .select({ id: users.id, hash: users.passwordHash })
      .from(users)
      .where(eq(sql`lower(${users.email})`, email.toLowerCase()));
    if (user?.hash && (await verifyPassword(password, user.hash))) return user.id;
  }
  // First sign-in after setup: the owner has no password yet and uses APP_PASSCODE once.
  const passcode = process.env.APP_PASSCODE;
  if (passcode && sameText(password, passcode)) {
    const [owner] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "owner"), isNull(users.passwordHash)))
      .limit(1);
    if (owner) return owner.id;
  }
  return null;
}

export async function unlock(_: { error?: string } | undefined, form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const userId = password ? await findUserId(email, password) : null;
  if (!userId) {
    await new Promise((r) => setTimeout(r, 450));
    return { error: "E-mailadres of wachtwoord klopt niet." };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  const next = String(form.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}
