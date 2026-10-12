"use server";

import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/session";

export async function updateSettings(input: { timezone?: string; weekStart?: number }) {
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
  await db.update(settings).set(v).where(eq(settings.id, 1));
  revalidatePath("/", "layout");
}

/** Invalidates every existing calendar subscription. */
export async function rotateCalendarToken() {
  await db
    .update(settings)
    .set({ icsToken: sql`replace(gen_random_uuid()::text, '-', '')` })
    .where(eq(settings.id, 1));
  revalidatePath("/settings");
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/unlock");
}
