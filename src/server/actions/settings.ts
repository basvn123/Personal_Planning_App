"use server";

import { and, asc, eq, ne, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { settings, users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { SESSION_COOKIE } from "@/lib/session";
import { requireOwner, requireUserId, setSessionCookie } from "@/server/auth";

const email = z.email().max(200);
const password = z.string().min(8, "Minstens 8 tekens.").max(200);
const name = z.string().trim().min(1).max(80);

export async function updateSettings(input: { timezone?: string; weekStart?: number }) {
  const userId = await requireUserId();
  const v = z
    .object({
      timezone: z
        .string()
        .refine((tz) => {
          try {
            new Intl.DateTimeFormat("en", { timeZone: tz });
            return true;
          } catch {
            return false;
          }
        })
        .optional(),
      weekStart: z.union([z.literal(0), z.literal(1)]).optional(),
    })
    .parse(input);
  await db.update(settings).set(v).where(eq(settings.userId, userId));
  revalidatePath("/", "layout");
}

/** Invalidates every existing calendar subscription for this account. */
export async function rotateCalendarToken() {
  const userId = await requireUserId();
  await db
    .update(settings)
    .set({ icsToken: sql`replace(gen_random_uuid()::text, '-', '')` })
    .where(eq(settings.userId, userId));
  revalidatePath("/settings");
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/unlock");
}

type Result = { ok: true } | { ok: false; error: string };

async function emailTaken(address: string, exceptId?: string) {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(sql`lower(${users.email})`, address.toLowerCase()), exceptId ? ne(users.id, exceptId) : undefined));
  return Boolean(row);
}

export async function updateAccount(input: { name: string; email: string }): Promise<Result> {
  const userId = await requireUserId();
  const n = name.safeParse(input.name);
  const e = email.safeParse(input.email.trim());
  if (!n.success) return { ok: false, error: "Vul een naam in." };
  if (!e.success) return { ok: false, error: "Dat e-mailadres klopt niet." };
  if (await emailTaken(e.data, userId)) return { ok: false, error: "Dat e-mailadres is al in gebruik." };
  await db.update(users).set({ name: n.data, email: e.data }).where(eq(users.id, userId));
  revalidatePath("/settings");
  return { ok: true };
}

/** The first password needs no current one: that is the owner leaving the setup passcode behind. */
export async function changePassword(input: { current: string; next: string }): Promise<Result> {
  const userId = await requireUserId();
  const [me] = await db.select({ hash: users.passwordHash, email: users.email }).from(users).where(eq(users.id, userId));
  if (!me?.email) return { ok: false, error: "Stel eerst je e-mailadres in." };
  if (me.hash && !(await verifyPassword(input.current, me.hash))) {
    return { ok: false, error: "Je huidige wachtwoord klopt niet." };
  }
  const p = password.safeParse(input.next);
  if (!p.success) return { ok: false, error: "Een wachtwoord heeft minstens 8 tekens." };
  // Other devices are signed out; this one gets a fresh session.
  const [row] = await db
    .update(users)
    .set({ passwordHash: await hashPassword(p.data), sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(eq(users.id, userId))
    .returning({ v: users.sessionVersion });
  await setSessionCookie(userId, row.v);
  revalidatePath("/settings");
  return { ok: true };
}

export async function listPeople() {
  await requireOwner();
  return db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.createdAt));
}

/** Owner only: creates an account with its own empty planner. */
export async function invitePerson(input: { name: string; email: string; password: string }): Promise<Result> {
  await requireOwner();
  const n = name.safeParse(input.name);
  const e = email.safeParse(input.email.trim());
  const p = password.safeParse(input.password);
  if (!n.success) return { ok: false, error: "Vul een naam in." };
  if (!e.success) return { ok: false, error: "Dat e-mailadres klopt niet." };
  if (!p.success) return { ok: false, error: "Een wachtwoord heeft minstens 8 tekens." };
  if (await emailTaken(e.data)) return { ok: false, error: "Dat e-mailadres is al in gebruik." };
  const hash = await hashPassword(p.data);
  await db.transaction(async (tx) => {
    const [u] = await tx
      .insert(users)
      .values({ name: n.data, email: e.data, passwordHash: hash, role: "member" })
      .returning({ id: users.id });
    await tx.insert(settings).values({ userId: u.id });
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function resetPassword(userId: string, next: string): Promise<Result> {
  const owner = await requireOwner();
  z.uuid().parse(userId);
  if (userId === owner.id) return { ok: false, error: "Wijzig je eigen wachtwoord bij Account." };
  const p = password.safeParse(next);
  if (!p.success) return { ok: false, error: "Een wachtwoord heeft minstens 8 tekens." };
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(p.data), sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(eq(users.id, userId));
  return { ok: true };
}

/** Removes the account and everything in it. */
export async function removePerson(userId: string): Promise<Result> {
  const owner = await requireOwner();
  z.uuid().parse(userId);
  if (userId === owner.id) return { ok: false, error: "Je kunt jezelf niet verwijderen." };
  await db.delete(users).where(and(eq(users.id, userId), eq(users.role, "member")));
  revalidatePath("/settings");
  return { ok: true };
}
