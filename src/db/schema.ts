import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* People with their own private planner. The owner invites the others. */
export const users = pgTable(
  "users",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email"),
    passwordHash: text("password_hash"),
    role: text("role", { enum: ["owner", "member"] }).notNull().default("member"),
    /* Bumped on password changes; sessions carrying an older number stop working. */
    sessionVersion: integer("session_version").notNull().default(1),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_uq").on(sql`lower(${t.email})`)],
);

/* Failed sign-ins, for throttling by address and by email. */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: id(),
    ip: text("ip").notNull(),
    email: text("email").notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_ip_idx").on(t.ip, t.attemptedAt), index("login_attempts_email_idx").on(t.email, t.attemptedAt)],
);

const owner = () =>
  uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

/* Sections: unlimited, nestable workspaces. Everything hangs off these. */
export const sections = pgTable(
  "sections",
  {
    id: id(),
    userId: owner(),
    parentId: uuid("parent_id").references((): AnyPgColumn => sections.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color").notNull().default("moss"),
    icon: text("icon"),
    rank: text("rank").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("sections_user_slug_uq").on(t.userId, t.slug),
    index("sections_parent_idx").on(t.parentId, t.rank),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: id(),
    userId: owner(),
    name: text("name").notNull(),
    color: text("color"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("tags_user_name_uq").on(t.userId, sql`lower(${t.name})`)],
);

/* Projects: progress trackers with a target in user-defined units. */
export const projects = pgTable(
  "projects",
  {
    id: id(),
    userId: owner(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    unitLabel: text("unit_label").notNull().default("units"),
    targetUnits: numeric("target_units", { mode: "number" }).notNull(),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("projects_section_idx").on(t.sectionId),
    check("projects_target_positive", sql`${t.targetUnits} > 0`),
  ],
);

/* Strict recurring schedules. Occurrences materialize into tasks. */
export const schedules = pgTable(
  "schedules",
  {
    id: id(),
    userId: owner(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    rrule: text("rrule").notNull(),
    startTime: time("start_time").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    units: numeric("units", { mode: "number" }),
    active: boolean("active").notNull().default(true),
    materializedUntil: date("materialized_until"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("schedules_section_idx").on(t.sectionId)],
);

export const imports = pgTable("imports", {
  id: id(),
  userId: owner(),
  filename: text("filename").notNull(),
  kind: text("kind").notNull(),
  taskCount: integer("task_count").notNull().default(0),
  createdAt: createdAt(),
});

/*
 * Tasks. planned_date NULL means the task sits in its section backlog.
 * Routing only sets planned_date / planned_start, so the section link is kept.
 */
export const tasks = pgTable(
  "tasks",
  {
    id: id(),
    userId: owner(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    notesMd: text("notes_md").notNull().default(""),
    status: text("status", { enum: ["todo", "doing", "done"] })
      .notNull()
      .default("todo"),
    plannedDate: date("planned_date"),
    plannedStart: time("planned_start"),
    plannedMinutes: integer("planned_minutes"),
    units: numeric("units", { mode: "number" }),
    rank: text("rank").notNull(),
    scheduleId: uuid("schedule_id").references(() => schedules.id, {
      onDelete: "set null",
    }),
    occurrenceDate: date("occurrence_date"),
    isDetached: boolean("is_detached").notNull().default(false),
    importId: uuid("import_id").references(() => imports.id, {
      onDelete: "cascade",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("tasks_section_idx").on(t.sectionId, t.rank),
    index("tasks_planned_idx").on(t.userId, t.plannedDate, t.plannedStart),
    index("tasks_project_idx").on(t.projectId),
    uniqueIndex("tasks_schedule_occurrence_uq").on(
      t.scheduleId,
      t.occurrenceDate,
    ),
    check(
      "tasks_status_check",
      sql`${t.status} in ('todo', 'doing', 'done')`,
    ),
  ],
);

/* Time entries. ended_at NULL means the timer is running; only one may run. */
export const timeEntries = pgTable(
  "time_entries",
  {
    id: id(),
    userId: owner(),
    taskId: uuid("task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    note: text("note"),
    source: text("source", { enum: ["timer", "manual", "import"] })
      .notNull()
      .default("timer"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("time_entries_started_idx").on(t.userId, t.startedAt),
    index("time_entries_section_started_idx").on(t.sectionId, t.startedAt),
    index("time_entries_task_idx").on(t.taskId),
    uniqueIndex("time_entries_one_running_uq")
      .on(t.userId)
      .where(sql`${t.endedAt} is null`),
    check(
      "time_entries_range_check",
      sql`${t.endedAt} is null or ${t.endedAt} >= ${t.startedAt}`,
    ),
  ],
);

export const progressLogs = pgTable(
  "progress_logs",
  {
    id: id(),
    userId: owner(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, {
      onDelete: "cascade",
    }),
    units: numeric("units", { mode: "number" }).notNull(),
    note: text("note"),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("progress_logs_project_idx").on(t.projectId, t.loggedAt),
    uniqueIndex("progress_logs_task_uq").on(t.taskId),
  ],
);

export const documents = pgTable(
  "documents",
  {
    id: id(),
    userId: owner(),
    title: text("title").notNull().default(""),
    contentMd: text("content_md").notNull().default(""),
    pinned: boolean("pinned").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("documents_updated_idx").on(t.userId, t.updatedAt)],
);

/* Uploaded files (PDFs, images, slides...) stored in blob storage, filed under a section. */
export const files = pgTable(
  "files",
  {
    id: id(),
    userId: owner(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    storageKey: text("storage_key").notNull(),
    url: text("url").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("files_section_idx").on(t.sectionId, t.createdAt)],
);

export const documentSections = pgTable(
  "document_sections",
  {
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.documentId, t.sectionId] }),
    index("document_sections_section_idx").on(t.sectionId),
  ],
);

export const documentTasks = pgTable(
  "document_tasks",
  {
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.documentId, t.taskId] }),
    index("document_tasks_task_idx").on(t.taskId),
  ],
);

export const taskTags = pgTable(
  "task_tags",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.taskId, t.tagId] }),
    index("task_tags_tag_idx").on(t.tagId),
  ],
);

export const documentTags = pgTable(
  "document_tags",
  {
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.documentId, t.tagId] }),
    index("document_tags_tag_idx").on(t.tagId),
  ],
);

/* Per-person settings. */
export const settings = pgTable("settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  timezone: text("timezone").notNull().default("Europe/Brussels"),
  weekStart: integer("week_start").notNull().default(1),
  icsToken: text("ics_token")
    .notNull()
    .unique()
    .default(sql`replace(gen_random_uuid()::text, '-', '')`),
  updatedAt: updatedAt(),
});

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  parent: one(sections, {
    fields: [sections.parentId],
    references: [sections.id],
    relationName: "children",
  }),
  children: many(sections, { relationName: "children" }),
  tasks: many(tasks),
  projects: many(projects),
  documents: many(documentSections),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  section: one(sections, {
    fields: [projects.sectionId],
    references: [sections.id],
  }),
  tasks: many(tasks),
  progressLogs: many(progressLogs),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  section: one(sections, {
    fields: [tasks.sectionId],
    references: [sections.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  schedule: one(schedules, {
    fields: [tasks.scheduleId],
    references: [schedules.id],
  }),
  timeEntries: many(timeEntries),
  documents: many(documentTasks),
  tags: many(taskTags),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  task: one(tasks, { fields: [timeEntries.taskId], references: [tasks.id] }),
  section: one(sections, {
    fields: [timeEntries.sectionId],
    references: [sections.id],
  }),
}));

export const documentsRelations = relations(documents, ({ many }) => ({
  sections: many(documentSections),
  tasks: many(documentTasks),
  tags: many(documentTags),
}));

export const documentSectionsRelations = relations(
  documentSections,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentSections.documentId],
      references: [documents.id],
    }),
    section: one(sections, {
      fields: [documentSections.sectionId],
      references: [sections.id],
    }),
  }),
);

export const documentTasksRelations = relations(documentTasks, ({ one }) => ({
  document: one(documents, {
    fields: [documentTasks.documentId],
    references: [documents.id],
  }),
  task: one(tasks, { fields: [documentTasks.taskId], references: [tasks.id] }),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, { fields: [taskTags.taskId], references: [tasks.id] }),
  tag: one(tags, { fields: [taskTags.tagId], references: [tags.id] }),
}));

export const documentTagsRelations = relations(documentTags, ({ one }) => ({
  document: one(documents, {
    fields: [documentTags.documentId],
    references: [documents.id],
  }),
  tag: one(tags, { fields: [documentTags.tagId], references: [tags.id] }),
}));

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  section: one(sections, {
    fields: [schedules.sectionId],
    references: [sections.id],
  }),
  tasks: many(tasks),
}));

export const progressLogsRelations = relations(progressLogs, ({ one }) => ({
  project: one(projects, {
    fields: [progressLogs.projectId],
    references: [projects.id],
  }),
  task: one(tasks, { fields: [progressLogs.taskId], references: [tasks.id] }),
}));

export type Section = typeof sections.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type User = typeof users.$inferSelect;
export type StoredFile = typeof files.$inferSelect;
