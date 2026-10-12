"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { progressLogs, projects } from "@/db/schema";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const projectSchema = z.object({
  sectionId: z.uuid(),
  name: z.string().trim().min(1).max(120),
  unitLabel: z.string().trim().min(1).max(30),
  targetUnits: z.number().positive().max(1_000_000),
  dueDate: day.nullable().optional(),
});

export async function createProject(input: z.input<typeof projectSchema>) {
  const v = projectSchema.parse(input);
  await db.insert(projects).values({ ...v, dueDate: v.dueDate ?? null });
  revalidatePath("/", "layout");
}

export async function updateProject(id: string, input: Partial<z.input<typeof projectSchema>>) {
  z.uuid().parse(id);
  const v = projectSchema.partial().parse(input);
  await db.update(projects).set(v).where(eq(projects.id, id));
  revalidatePath("/", "layout");
}

export async function archiveProject(id: string) {
  await db.update(projects).set({ archivedAt: new Date() }).where(eq(projects.id, z.uuid().parse(id)));
  revalidatePath("/", "layout");
}

/** Manual progress: positive to add units, negative to correct. */
export async function logProgress(projectId: string, units: number, note?: string) {
  z.uuid().parse(projectId);
  const u = z.number().refine((n) => n !== 0 && Math.abs(n) <= 100_000).parse(units);
  await db.insert(progressLogs).values({ projectId, units: u, note: note?.slice(0, 300) || null });
  revalidatePath("/", "layout");
}
