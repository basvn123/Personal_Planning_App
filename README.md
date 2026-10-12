# Planner

Personal productivity system: week and day planning, time tracking, markdown docs per section, progress tracking. Single user, hosted on Vercel, data in any Postgres 13+ (Neon, Supabase or your own).

## Stack

Next.js 15 (App Router) · TypeScript · Drizzle ORM + Postgres (provider-agnostic) · TanStack Query · Zustand (UI state only) · Tailwind CSS v4 with a custom token theme · Radix primitives · cmdk.

## Local development

```bash
npm install
cp .env.example .env.local   # fill DATABASE_URL, APP_PASSCODE, SESSION_SECRET
npm run db:migrate
npm run db:seed              # starter sections, only into an empty database
npm run dev
```

Checks: `npm run typecheck`, `npm run lint` (ESLint plus a copy check that rejects em dashes and stock AI phrasing), `npm test`.

Schema changes: edit `src/db/schema.ts`, then `npm run db:generate` and commit the migration in `src/db/migrations`.

## Deploying to Vercel

1. Import the repo in Vercel.
2. Add a Postgres database. Easiest: Storage → Create Database → Neon. It injects `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct), which the app reads as is. Supabase also works (it injects `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING`, also read automatically), as does any Postgres 13+ where you set `DATABASE_URL` yourself.
3. Add `APP_PASSCODE`, `SESSION_SECRET` (32+ random characters) and `CRON_SECRET` (any random string; Vercel Cron sends it to keep recurring schedules filled ahead).
4. Deploy. The `vercel-build` script runs migrations and the idempotent seed before `next build`.

## Data model

Sections, tags and projects are user-created rows; nothing is hardcoded. Tasks always belong to a section; a task with no `planned_date` is in that section's backlog, and routing it to a day only sets the date. Time entries with no `ended_at` are running timers, and a partial unique index allows only one. Daily rollups come from the `v_daily_*` views in the owner's timezone.
