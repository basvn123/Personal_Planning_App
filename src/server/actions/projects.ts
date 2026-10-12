"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { progressLogs, projects } from "@/db/schema";
import { requireUserId } from "@/server/auth";
import { ownProjects, ownSections } from "@/server/own";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const projectSchema = z.object({
  sectionId: z.uuid(),
  name: z.string().trim().min(1).max(120),
  unitLabel: z.string().trim().min(1).max(30),
  targetUnits: z.number().positive().max(1_000_000),
  dueDate: day.nullable().optional(),
});

export async function createProject(input: z.input<typeof projectSchema>) {
  const userId = await requireUserId();
  const v = projectSchema.parse(input);
  await ownSections(userId, v.sectionId);
  await db.insert(projects).values({ ...v, userId, dueDate: v.dueDate ?? null });
  revalidatePath("/", "layout");
}

export async function updateProject(id: string, input: Partial<z.input<typeof projectSchema>>) {
  const userId = await requireUserId();
  z.uuid().parse(id);
  const v = projectSchema.partial().parse(input);
  if (v.sectionId) await ownSections(userId, v.sectionId);
  await db
    .update(projects)
    .set(v)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
  revalidatePath("/", "layout");
}

export async function archiveProject(id: string) {
  const userId = await requireUserId();
  await db
    .update(projects)
    .set({ archivedAt: new Date() })
    .where(and(eq(projects.id, z.uuid().parse(id)), eq(projects.userId, userId)));
  revalidatePath("/", "layout");
}

/** Manual progress: positive to add units, negative to correct. */
export async function logProgress(projectId: string, units: number, note?: string) {
  const userId = await requireUserId();
  z.uuid().parse(projectId);
  await ownProjects(userId, projectId);
  const u = z.number().refine((n) => n !== 0 && Math.abs(n) <= 100_000).parse(units);
  await db.insert(progressLogs).values({ userId, projectId, units: u, note: note?.slice(0, 300) || null });
  revalidatePath("/", "layout");
}
