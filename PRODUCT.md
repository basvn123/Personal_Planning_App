# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated, with hard constraints from the user: hosted on Vercel, backed by a persistent production database. Chosen: Next.js (App Router, TypeScript), Postgres on Supabase via Drizzle ORM, TanStack Query for server state with optimistic updates, Tailwind CSS v4 with a fully custom token theme (default palette disabled).

## Users

The owner, plus people the owner invites; each has a private planner. A student and working professional who juggles study courses, work, side projects (for example "Carta", "Cloud Skills"), language learning (Italian), sport (triathlon training) and personal lists (gift ideas). Uses it every day on both desktop and phone, with equal weight: planning the week at a desk, checking today, starting and stopping timers, and capturing tasks on the go.

## Product Purpose

A personal productivity operating system. One place to plan days and weeks, track the time actually spent, keep markdown documentation per area of life, and watch long-running projects move toward their goals. Success: the owner trusts it enough to stop using separate planners, timers and notes apps, and data never disappears.

## Positioning

Everything hangs off user-created sections. A section is at once a workspace, a backlog, a document folder, a time bucket and a progress tracker, so planning, doing, logging and reflecting share one structure instead of living in separate tools.

## Operating Context

- Weekly ritual: route tasks from section backlogs into days, review last week's hours.
- Daily: open today, work through scheduled blocks, run a timer per task, log time retroactively when forgotten.
- Strict recurring commitments (classes, training sessions) appear automatically and stay editable.
- External training schemes arrive as CSV or JSON and get imported into the plan.
- The plan is exported to iPhone Calendar via .ics.

## Capabilities and Constraints

- Sections, tags and projects are unlimited and user-created; nothing is hardcoded.
- Markdown documents live in sections and link to tasks.
- Timer with play/stop, plus manual entries; totals roll up per day, week, task and section.
- Projects carry a target in units (for example "Italian: 200 lessons") and show progress and momentum.
- Invite-only accounts with email and password; the owner invites and manages people. No public sign-up. Data is private per account.
- UI language: Dutch, including dates and quick-add day words.
- Sections hold uploaded files (private storage) next to markdown documents.

## Brand Commitments

- No visible product name in the UI; at most a small mark. The app speaks for itself.
- Custom colors only; no default framework palettes.
- Minimal, high-density, professional. Very little explanatory text on the page itself; each page has an info button that explains it on demand.
- No AI-sounding language and no em dashes anywhere in the UI copy.

## Evidence on Hand

No real data yet. Section names from the brief (Work, Study, Carta, Cloud Skills, Italian, Gift Ideas) may seed a demo dataset, labeled as sample data.

## Product Principles

1. Data is sacred: every change persists immediately and visibly.
2. Structure is user-made: the system adapts to new sections without code changes.
3. Fast over explanatory: keyboard-first on desktop, thumb-first on phone, no instructional copy.
4. Time is the truth: plans are compared against what was actually logged.
5. Momentum is visible: progress is shown, not described.
