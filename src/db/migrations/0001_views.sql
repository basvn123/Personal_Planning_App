-- Daily rollups in the owner's timezone. Running entries count up to now().
-- Entries are attributed to the local day they started on.
CREATE OR REPLACE VIEW "v_time_entries_local" AS
SELECT
  te.id,
  te.task_id,
  te.section_id,
  te.started_at,
  te.ended_at,
  (te.started_at AT TIME ZONE s.timezone)::date AS day,
  EXTRACT(EPOCH FROM (COALESCE(te.ended_at, now()) - te.started_at))::bigint AS seconds
FROM "time_entries" te
CROSS JOIN (SELECT timezone FROM "settings" WHERE id = 1) s;
--> statement-breakpoint
CREATE OR REPLACE VIEW "v_daily_section_seconds" AS
SELECT day, section_id, SUM(seconds)::bigint AS seconds
FROM "v_time_entries_local"
GROUP BY day, section_id;
--> statement-breakpoint
CREATE OR REPLACE VIEW "v_daily_task_seconds" AS
SELECT day, task_id, section_id, SUM(seconds)::bigint AS seconds
FROM "v_time_entries_local"
WHERE task_id IS NOT NULL
GROUP BY day, task_id, section_id;
--> statement-breakpoint
INSERT INTO "settings" (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
