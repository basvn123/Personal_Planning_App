---
version: 1
slug: "src-app-app-layout-tsx"
primary_target: "src/app/(app)/layout.tsx"
related_targets: []
---

# App shell and planner surfaces

Scope: the whole authenticated app (shell, week, day, section, dashboard). Mode: Operate.
Audience and job: the owner, daily on desktop and phone; plan the week, work today, log time, keep notes per section.
Constraints: no visible product name, no explanatory copy, no em dashes, custom palette only, dense.

## Direction contract

THESIS: The app is a bound weekly planner opened flat: two facing pages split by a gutter, a satin ribbon marking today, index tabs on the fore-edge for sections. It refuses the SaaS default of a grey sidebar beside a grid of cards.

OWN-WORLD: Bright cool paper (not cream) with a faint printed dot grid, deep bottle-green book cloth for the cover edge and primary actions, a marigold satin ribbon as the single accent (today, running timer, selection). Section colors are index-tab dyes. Hairline printed rules, page-curve shadow only at the gutter. Dark theme is the same book at night: ink paper, chalk dots, same cloth and ribbon. Schibsted Grotesk for all UI, JetBrains Mono tabular figures for times and durations.

STORY: Open the book and you are on this week. You see what is planned, what was actually logged, and what is running, then flip to any section by its tab.

FIRST VIEWPORT: Desktop: cloth spine strip at far left (nav glyphs, timer), left page lists Monday to Sunday as stacked day rows with planned and logged hours in the margin; right page holds today's detail and the section backlog; fore-edge tabs on the right edge, one per section, stacked. Ribbon hangs from the top edge over today's row. Phone: one page at a time, swipe or tap between left and right page, tabs become a horizontal strip, cloth bar at bottom with nav and timer.

FORM: Planner spread, ranked 1 on own list (user's choice over assigned candidate 5), seed key 237e5e6d, roll degraded.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
