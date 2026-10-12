"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

function matches(input: string, expected: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function unlock(_: { error?: string } | undefined, form: FormData) {
  const expected = process.env.APP_PASSCODE;
  if (!expected) return { error: "APP_PASSCODE is not configured." };

  const passcode = String(form.get("passcode") ?? "");
  if (!matches(passcode, expected)) {
    await new Promise((r) => setTimeout(r, 400));
    return { error: "Wrong passcode." };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  const next = String(form.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}
