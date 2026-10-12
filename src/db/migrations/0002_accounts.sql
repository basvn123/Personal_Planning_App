CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"password_hash" text,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Everything that already exists belongs to the first account, the owner.
-- The owner has no password yet and signs in once with APP_PASSCODE to set one.
INSERT INTO "users" ("name", "role") VALUES ('Eigenaar', 'owner');
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"name" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"storage_key" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP VIEW IF EXISTS "v_daily_task_seconds";
--> statement-breakpoint
DROP VIEW IF EXISTS "v_daily_section_seconds";
--> statement-breakpoint
DROP VIEW IF EXISTS "v_time_entries_local";
--> statement-breakpoint
DROP INDEX "sections_slug_uq";
--> statement-breakpoint
DROP INDEX "tags_name_uq";
--> statement-breakpoint
DROP INDEX "documents_updated_idx";
--> statement-breakpoint
DROP INDEX "tasks_planned_idx";
--> statement-breakpoint
DROP INDEX "time_entries_started_idx";
--> statement-breakpoint
DROP INDEX "time_entries_one_running_uq";
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
UPDATE "documents" SET "user_id" = (SELECT id FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1);
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "imports" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
UPDATE "imports" SET "user_id" = (SELECT id FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1);
--> statement-breakpoint
ALTER TABLE "imports" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "imports" ADD CONSTRAINT "imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "progress_logs" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
UPDATE "progress_logs" SET "user_id" = (SELECT id FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1);
--> statement-breakpoint
ALTER TABLE "progress_logs" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
UPDATE "projects" SET "user_id" = (SELECT id FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
UPDATE "schedules" SET "user_id" = (SELECT id FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1);
--> statement-breakpoint
ALTER TABLE "schedules" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
UPDATE "sections" SET "user_id" = (SELECT id FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1);
--> statement-breakpoint
ALTER TABLE "sections" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
UPDATE "tags" SET "user_id" = (SELECT id FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1);
--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
UPDATE "tasks" SET "user_id" = (SELECT id FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1);
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
UPDATE "time_entries" SET "user_id" = (SELECT id FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1);
--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
UPDATE "settings" SET "user_id" = (SELECT id FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1);
--> statement-breakpoint
INSERT INTO "settings" ("user_id") SELECT (SELECT id FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1) WHERE NOT EXISTS (SELECT 1 FROM "settings");
--> statement-breakpoint
ALTER TABLE "settings" DROP CONSTRAINT "settings_pkey";
--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "id";
--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "settings" ADD PRIMARY KEY ("user_id");
--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_ics_token_unique" UNIQUE("ics_token");
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "files_section_idx" ON "files" USING btree ("section_id","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree (lower("email"));
--> statement-breakpoint
CREATE UNIQUE INDEX "sections_user_slug_uq" ON "sections" USING btree ("user_id","slug");
--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_uq" ON "tags" USING btree ("user_id",lower("name"));
--> statement-breakpoint
CREATE INDEX "documents_updated_idx" ON "documents" USING btree ("user_id","updated_at");
--> statement-breakpoint
CREATE INDEX "tasks_planned_idx" ON "tasks" USING btree ("user_id","planned_date","planned_start");
--> statement-breakpoint
CREATE INDEX "time_entries_started_idx" ON "time_entries" USING btree ("user_id","started_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "time_entries_one_running_uq" ON "time_entries" USING btree ("user_id") WHERE "time_entries"."ended_at" is null;
--> statement-breakpoint
-- Daily rollups, now per person and in each person's own timezone.
CREATE VIEW "v_time_entries_local" AS
SELECT
  te.id,
  te.user_id,
  te.task_id,
  te.section_id,
  te.started_at,
  te.ended_at,
  (te.started_at AT TIME ZONE s.timezone)::date AS day,
  EXTRACT(EPOCH FROM (COALESCE(te.ended_at, now()) - te.started_at))::bigint AS seconds
FROM "time_entries" te
JOIN "settings" s ON s.user_id = te.user_id;
--> statement-breakpoint
CREATE VIEW "v_daily_section_seconds" AS
SELECT user_id, day, section_id, SUM(seconds)::bigint AS seconds
FROM "v_time_entries_local"
GROUP BY user_id, day, section_id;
--> statement-breakpoint
CREATE VIEW "v_daily_task_seconds" AS
SELECT user_id, day, task_id, section_id, SUM(seconds)::bigint AS seconds
FROM "v_time_entries_local"
WHERE task_id IS NOT NULL
GROUP BY user_id, day, task_id, section_id;
