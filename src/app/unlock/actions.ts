"use server";

import { timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { loginAttempts, users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/server/auth";
import { safeNext } from "./safe-next";

const WINDOW_MINUTES = 15;
const MAX_PER_IP = 20;
const MAX_PER_EMAIL = 8;
// Checked against when the email is unknown, so every failure costs one scrypt run.
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

function sameText(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

async function tooMany(ip: string, email: string) {
  const since = sql`now() - make_interval(mins => ${WINDOW_MINUTES})`;
  const [row] = await db
    .select({
      byIp: sql<number>`count(*) filter (where ${loginAttempts.ip} = ${ip})::int`,
      byEmail: sql<number>`count(*) filter (where ${loginAttempts.email} = ${email})::int`,
    })
    .from(loginAttempts)
    .where(and(gt(loginAttempts.attemptedAt, since), or(eq(loginAttempts.ip, ip), eq(loginAttempts.email, email))));
  return (row?.byIp ?? 0) >= MAX_PER_IP || (email !== "" && (row?.byEmail ?? 0) >= MAX_PER_EMAIL);
}

async function findUser(email: string, password: string): Promise<{ id: string; v: number } | null> {
  if (email) {
    const [user] = await db
      .select({ id: users.id, hash: users.passwordHash, v: users.sessionVersion })
      .from(users)
      .where(eq(sql`lower(${users.email})`, email));
    const ok = await verifyPassword(password, user?.hash ?? DUMMY_HASH);
    if (user?.hash && ok) return { id: user.id, v: user.v };
  } else {
    await verifyPassword(password, DUMMY_HASH);
  }
  // First sign-in after setup: the owner has no password yet and uses APP_PASSCODE once.
  const passcode = process.env.APP_PASSCODE;
  if (passcode && sameText(password, passcode)) {
    const [owner] = await db
      .select({ id: users.id, v: users.sessionVersion })
      .from(users)
      .where(and(eq(users.role, "owner"), isNull(users.passwordHash)))
      .limit(1);
    if (owner) return owner;
  }
  return null;
}

export async function unlock(_: { error?: string } | undefined, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(form.get("password") ?? "").slice(0, 500);
  const ip = await clientIp();

  if (await tooMany(ip, email)) {
    return { error: "Te veel pogingen. Probeer het over een kwartier opnieuw." };
  }

  const user = password ? await findUser(email, password) : null;
  if (!user) {
    await db.insert(loginAttempts).values({ ip, email });
    await db.delete(loginAttempts).where(lt(loginAttempts.attemptedAt, sql`now() - interval '1 day'`));
    return { error: "E-mailadres of wachtwoord klopt niet." };
  }

  await db.delete(loginAttempts).where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.email, email)));
  await setSessionCookie(user.id, user.v);
  redirect(safeNext(String(form.get("next") ?? "/")));
}
