import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import { documents, projects, schedules, sections, tasks, timeEntries } from "@/db/schema";

type Owned = PgTable & { id: AnyPgColumn; userId: AnyPgColumn };

async function owns(table: Owned, userId: string, ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return;
  const rows = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.userId, userId), inArray(table.id, unique)));
  // Someone else's id looks exactly like a missing one.
  if (rows.length !== unique.length) throw new Error("Not found");
}

export const ownSections = (userId: string, ...ids: string[]) => owns(sections, userId, ids);
export const ownTasks = (userId: string, ...ids: string[]) => owns(tasks, userId, ids);
export const ownDocuments = (userId: string, ...ids: string[]) => owns(documents, userId, ids);
export const ownProjects = (userId: string, ...ids: string[]) => owns(projects, userId, ids);
export const ownSchedules = (userId: string, ...ids: string[]) => owns(schedules, userId, ids);
export const ownEntries = (userId: string, ...ids: string[]) => owns(timeEntries, userId, ids);
