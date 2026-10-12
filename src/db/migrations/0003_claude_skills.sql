-- "Cloud Skills" is about Claude, Anthropic's AI tool.
UPDATE "sections" s
SET "name" = 'Claude Skills', "slug" = 'claude-skills'
WHERE s."slug" = 'cloud-skills'
  AND s."name" = 'Cloud Skills'
  AND NOT EXISTS (
    SELECT 1 FROM "sections" o WHERE o."user_id" = s."user_id" AND o."slug" = 'claude-skills'
  );
