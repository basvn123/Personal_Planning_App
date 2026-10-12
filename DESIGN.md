---
name: Planner
description: A personal planner bound as a book, opened flat on this week.
colors:
  cloth: "oklch(0.355 0.062 163)"
  cloth-2: "oklch(0.3 0.055 163)"
  cloth-3: "oklch(0.42 0.06 163)"
  cloth-ink: "oklch(0.95 0.018 150)"
  cloth-ink-2: "oklch(0.8 0.03 155)"
  ribbon: "oklch(0.81 0.155 78)"
  ribbon-2: "oklch(0.74 0.16 70)"
  ribbon-ink: "oklch(0.52 0.13 62)"
  ribbon-wash: "oklch(0.955 0.045 85)"
  danger: "oklch(0.54 0.17 27)"
  danger-wash: "oklch(0.96 0.025 27)"
  paper: "oklch(0.986 0.003 250)"
  paper-2: "oklch(0.968 0.004 250)"
  paper-3: "oklch(0.945 0.005 250)"
  rule: "oklch(0.905 0.006 250)"
  rule-strong: "oklch(0.84 0.008 250)"
  dot: "oklch(0.86 0.008 250)"
  ink: "oklch(0.235 0.014 258)"
  ink-2: "oklch(0.43 0.013 258)"
  ink-3: "oklch(0.56 0.011 258)"
  heat-0: "oklch(0.93 0.008 250)"
  heat-1: "oklch(0.87 0.05 160)"
  heat-2: "oklch(0.74 0.08 162)"
  heat-3: "oklch(0.58 0.085 163)"
  heat-4: "oklch(0.42 0.07 163)"
  bar: "oklch(0.45 0.07 163)"
  dye-moss: "oklch(0.82 0.085 145)"
  dye-moss-deep: "oklch(0.48 0.1 145)"
  dye-lagoon: "oklch(0.82 0.075 200)"
  dye-lagoon-deep: "oklch(0.48 0.09 205)"
  dye-cobalt: "oklch(0.8 0.075 255)"
  dye-cobalt-deep: "oklch(0.47 0.14 260)"
  dye-iris: "oklch(0.8 0.08 290)"
  dye-iris-deep: "oklch(0.48 0.14 290)"
  dye-plum: "oklch(0.8 0.08 330)"
  dye-plum-deep: "oklch(0.48 0.14 335)"
  dye-rose: "oklch(0.83 0.08 10)"
  dye-rose-deep: "oklch(0.52 0.15 12)"
  dye-coral: "oklch(0.83 0.09 40)"
  dye-coral-deep: "oklch(0.55 0.15 38)"
  dye-ochre: "oklch(0.86 0.1 85)"
  dye-ochre-deep: "oklch(0.56 0.12 75)"
  dye-olive: "oklch(0.84 0.08 115)"
  dye-olive-deep: "oklch(0.5 0.1 115)"
  dye-slate: "oklch(0.82 0.02 250)"
  dye-slate-deep: "oklch(0.45 0.03 255)"
  dye-clay: "oklch(0.8 0.05 55)"
  dye-clay-deep: "oklch(0.5 0.08 50)"
  dye-teal: "oklch(0.82 0.08 175)"
  dye-teal-deep: "oklch(0.48 0.09 178)"
typography:
  headline:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "1.875rem"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: "1.5rem"
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.375rem"
    fontFeature: "\"ss01\", \"cv11\""
  body-sm:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  meta:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1.125rem"
  label:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: "1rem"
    letterSpacing: "0.08em"
  figures:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\""
  figures-lg:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\""
  doc-body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  xs: "3px"
  sm: "5px"
  md: "8px"
  lg: "12px"
spacing:
  row-week: "3px"
  row-day: "10px"
  page-x-phone: "20px"
  page-x-desk: "32px"
  page-top: "24px"
  dot-grid: "18px"
components:
  button-primary:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.cloth-ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.cloth-3}"
  button-quiet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
  button-quiet-hover:
    backgroundColor: "{colors.paper-3}"
  button-ghost:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.paper-3}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.paper}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
  icon-button:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    size: "32px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "36px"
  popover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px"
  segmented:
    backgroundColor: "{colors.paper-3}"
    rounded: "{rounded.sm}"
    padding: "2px"
  segmented-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  chip-choice:
    backgroundColor: "{colors.paper-3}"
    textColor: "{colors.ink-2}"
    typography: "{typography.meta}"
    rounded: "{rounded.xs}"
    padding: "0 8px"
    height: "28px"
  chip-choice-selected:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.cloth-ink}"
  spine-item:
    textColor: "{colors.cloth-ink-2}"
    rounded: "{rounded.md}"
    size: "40px"
  spine-item-active:
    backgroundColor: "{colors.cloth-3}"
    textColor: "{colors.cloth-ink}"
  task-check:
    rounded: "{rounded.xs}"
    size: "16px"
  timer-chip:
    backgroundColor: "{colors.ribbon}"
    typography: "{typography.meta}"
    rounded: "{rounded.sm}"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.meta}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
---

# Design System: Planner

## Overview

**Creative North Star: "The Planner Spread"**

The app is a bound weekly planner opened flat on the desk. A deep bottle-green book cloth wraps everything: it is the spine strip on the left, the window background behind the pages, and the bar along the bottom of a phone. Inside the cloth lie two facing pages of bright, cool paper printed with a faint dot grid, split by a gutter that darkens toward the binding. Index tabs dyed in each section's color stand out of the fore-edge on the right. A marigold satin ribbon runs down the left page through the days already past and ends in a forked tail on today's row. Nothing in the frame is a generic app sidebar or a grid of cards; every structural element is a part of a physical book.

Density is high and the voice is quiet. Rows are printed lines, not boxes. Structure comes from hairline rules, a small uppercase rubric per block, and tabular mono figures for every time and duration. Color is scarce and meaningful: cloth green for structure and primary action, marigold for "now" (today, the running timer, the drop target, focus, selection), section dyes for identity, and a single danger red. The dark theme is the same book at night: graphite paper with chalk dots, the same cloth, the same ribbon.

Motion is short and physical: tabs slide out of the fore-edge, popovers pop 3px into place, state changes fade in 150 to 250ms on an ease-out curve. Reduced motion collapses all of it.

**Key Characteristics:**
- Cloth frame, paper pages, a gutter, fore-edge tabs, a ribbon: the book is the layout.
- Cool paper (hue 250) with an 18px printed dot grid; never cream.
- One accent (marigold ribbon) that always means "now".
- Section dyes are identity tabs, paired fill plus deep tone, never a data palette.
- Every number is JetBrains Mono with tabular figures.
- Editing happens in anchored popovers, not modals or detail pages.

## Colors

A cool, near-neutral paper and graphite ink, framed in bottle-green cloth, with one warm marigold accent and twelve muted section dyes. All values are OKLCH and every token has a redefined dark value (see the sidecar); light values are listed in the frontmatter.

### Primary
- **Bottle-Green Book Cloth** (cloth): the cover. Spine and phone bar background, the window behind the pages, primary buttons, selected choice chips, the "+1" progress action. Its darker press (cloth-2) is the html background and its lighter weave (cloth-3) is hover, the active spine item, input focus border and the day meter fill.
- **Cloth Ink** (cloth-ink, cloth-ink-2): text and glyphs that sit on cloth. The softer tone is for resting nav glyphs; the brighter one for active and hover.

### Secondary
- **Marigold Satin Ribbon** (ribbon, ribbon-2): the single accent. The ribbon marker down the week, the running timer chip, today's bar in the daily chart, a completed project bar, the heatmap ring around today, text selection, the focus outline (ribbon-2, 2px, offset 2px) and the input caret.
- **Ribbon Ink** (ribbon-ink): marigold as legible text on paper. Today's weekday label, a running timer's live duration.
- **Ribbon Wash** (ribbon-wash): today's row tint (at 55%), a running task's row, a day row while a task is dragged over it.

### Tertiary
- **Section Dyes** (dye-moss through dye-teal, each with a -deep partner): twelve index-tab dyes the owner assigns to sections. The fill tone colors the tab, swatches and checkbox wash; the deep tone draws checkbox borders, checked fills and progress bars, and is the only tone that may carry meaning on text-weight marks. Components never pick a dye directly; they set `--dye` and `--dye-deep` from the section and read those.
- **Danger** (danger, danger-wash): destructive buttons, the behind-pace line on a project, error text.

### Neutral
- **Cool Paper** (paper, paper-2, paper-3): left page, right page (one step darker so the spread reads as two sheets), and recessed wells (segmented tracks, progress tracks, hover fills, code blocks).
- **Printed Rules** (rule, rule-strong): hairlines between rows, and the heavier rule under block rubrics, chart baselines, quiet button and input borders.
- **Dot** (dot): the printed dot grid only.
- **Graphite Ink** (ink, ink-2, ink-3): primary text, secondary text, and metadata, placeholders and rubric labels.
- **Heat Ramp** (heat-0 to heat-4) and **Bar** (bar): the single cloth-green hue used for time charts. Heat-0 is an empty cell; the ramp steps light to dark in light theme and reverses in dark so "more" is always more contrast.

### Named Rules
**The One Ribbon Rule.** Marigold means "now" and nothing else: today, what is running, where a drop will land, where focus is. It is never decoration, never a brand fill, never a second button color.

**The Dye Is Identity Rule.** Section dyes say which section, never how much. They are user-assigned and were not validated as a categorical palette, so no chart may place two dyes side by side as the only way to tell series apart.

**The Cool Paper Rule.** Paper sits at hue 250 with chroma under 0.01. A warm or cream paper breaks the world.

## Typography

**UI Font:** Schibsted Grotesk (with ui-sans-serif, system-ui), loaded as `--font-ui`, stylistic sets ss01 and cv11 on.
**Figures Font:** JetBrains Mono (with ui-monospace), loaded as `--font-figures`, applied through the figures style with tabular numerals and -0.01em tracking.

**Character:** A crisp, slightly condensed news grotesk does all the talking at small sizes; a mono with tabular figures handles every clock, duration, date number, count and percentage so columns of time line up like a printed ledger.

### Hierarchy
The scale is a custom compact ramp (11, 12, 13, 14, 16, 19, 24, 32px); the body default is 14px.
- **Headline** (600, 24px, 30px line, -0.02em): page titles ("Week 41", section name, Settings) and the selected day's title on the right page. Schedule and doc titles in their editors go one step up to 32px.
- **Title** (500, 16px, 24px line): project names, prominent single values.
- **Body** (400, 14px, 22px line): task titles in the day plan, inputs, popover content.
- **Body small** (400 or 500, 13px, 20px line): task titles in the week list, buttons, table rows, ranked bar labels.
- **Meta** (400, 12px, 18px line): task metadata lines, tooltips, hints, tab labels.
- **Label** (500, 11px, 0.08em tracking, uppercase, ink-3): the rubric that heads each block, sitting on a rule-strong underline; also weekday abbreviations and form field labels.
- **Figures** (mono, tabular): durations, clock times, date numbers (24px/500 for the day number in the week margin), percentages, units.
- **Doc body** (15px, 1.7 line height, 68ch max): rendered markdown only.

### Named Rules
**The Ledger Rule.** Any digit that measures time, counts or progress is set in the figures style. Proportional digits in a duration are a bug.

**The Rubric Rule.** A block is named by one 11px uppercase rubric on a hairline, never by a large heading. The rubric is the heading itself; nothing larger sits under it as a headline.

## Layout

The desktop layout is a horizontal book: a 56px cloth spine on the left (mark, nav glyphs, command palette, then timer, theme and settings at the foot), the page block in the middle with 12px of cloth above and below it, and a 48px fore-edge of stacked vertical tabs on the right. The page block is a two-column spread at 1024px and up: left page on paper, right page on paper-2, each scrolling independently.

On a phone (below 1024px) the spine becomes a 56px cloth bar along the bottom (safe-area aware), the fore-edge tabs become a horizontal tab strip on cloth along the top, and the spread becomes a horizontal snap scroller holding both pages with a two-way page switcher above it. Swiping and tapping both change pages, and routes can open on the right page.

Spacing is set by the paper: page side margins are 20px on a phone and 32px on desktop (40px on denser right pages), headers start 24px down, and the right margin reserves 44 to 56px for the ribbon and the time column. Week rows are a three-column grid (52px date, task list, 52px time meter) at least 76px tall; tasks inside them are 3px apart. Day-plan rows are 10px top and bottom with a hairline between them. Blocks are separated by 36px. The 18px dot grid is the only texture.

### Named Rules
**The Margin Rule.** Time lives in the right margin of a row, right-aligned, in figures; content never runs into it.

## Elevation & Depth

Depth is physical and sparse. The pages are flat paper; depth appears only where a real book has it.

### Shadow Vocabulary
- **Gutter shade** (`inset -28px 0 28px -24px var(--gutter-shade)` on the left page, mirrored on the right): the curve of paper into the binding. Desktop only.
- **Page stack** (`0 2px 0 var(--paper-3), 0 4px 0 var(--rule), 0 10px 30px -12px oklch(0 0 0 / 0.5)`): the stacked sheets under the page block on desktop.
- **Lift** (`var(--lift)`: `0 1px 2px` plus `0 4px 14px -4px`, graphite at 6% and 12%; darker in dark theme): anything that floats above paper. Popovers, tooltips, the command palette, a tab or task being dragged.
- **Tab cast** (`-3px 0 6px -2px`, cloth-tinted): the active fore-edge tab, pulled out over the page.

### Named Rules
**The Paper Is Flat Rule.** Rows, blocks and charts never get shadows or card boxes. Lift is only for things that float, and it is the single floating shadow.

## Shapes

Corners are small and tight, like cut paper. Inline controls, chips, the checkbox and choice chips use 3px; buttons, inputs, tooltips and segmented tracks use 5px; spine items and popovers use 8px; 12px is the ceiling. Bars in charts round only their free end (4px). Progress tracks and the day meter are fully rounded rods. The page block has a 3px corner at the spine and 6px at the fore-edge. Tabs round only the corner that sticks out of the book. The ribbon is a straight 14px band with a forked, clipped tail.

Lines are 1px hairlines; the checkbox border is 1.5px; focus is a 2px marigold outline.

## Components

### Buttons
Compact and printed, never pill-shaped.
- **Shape:** 32px tall, 12px side padding, small corners (5px), 13px medium label, optional 14px icon with 6px gap.
- **Primary:** cloth with cloth-ink text; hover lightens to cloth-3. Used once per surface, usually "Save" in a popover.
- **Quiet (default):** paper with a rule-strong border and ink text; hover to paper-3.
- **Ghost:** ink-2 text, no fill; hover adds paper-3 and ink.
- **Danger:** danger fill, paper text; hover 90% opacity.
- **Icon button:** 32px square, ink-2 glyph, hover paper-3. Icons are Lucide at 1.75 stroke.
- **Disabled:** 50% (40% for ghost and icon) opacity, not-allowed cursor. All transitions 150ms.

### Choice chips and segmented controls
- **Segmented control:** a paper-3 track with 2px inset; the selected segment becomes paper with ink text and a hairline shadow. Used for settings choices (week start, appearance) and as the phone page switcher.
- **Choice chips:** 28px figures chips on paper-3 (duration presets in the task editor); the selected one fills with cloth. Toggle off by pressing again.
- **Dye picker:** a 6-column grid of 28px dye swatches; selection is a 2px ink ring with paper offset and a check.

### Inputs / Fields
- **Style:** 36px, paper, rule-strong 1px border, 5px corners, 14px text, ink-3 placeholder, marigold caret.
- **Focus:** border shifts to cloth-3; keyboard focus adds the marigold outline.
- **Selects:** custom chevron, 32px right padding.
- **Inline quick-add:** a ruled line you write on, not a field. A plus glyph, transparent input, and live parse hints (section in a dye-washed chip, date, time and duration in figures) appearing only once something is typed. Understands #section, day names, 14:00 and 45m.

### Navigation
- **Spine:** 40px glyph squares on cloth, cloth-ink-2 at rest, cloth-3 at 60% on hover, solid cloth-3 with cloth-ink when current. Labels appear as ink tooltips on hover. The book mark (a closed cover with a ribbon) sits at the top; no product name.
- **Fore-edge tabs:** one per top-level section, set vertically, 64px minimum, filled with the section dye mixed 80% with cloth when resting and tucked 8px into the edge; hover slides out 4px; the active tab is pure dye, semibold, flush, and casts onto the page. Tabs are drag-sortable. On a phone they become top-rounded tabs in a horizontal strip, the active one rising 2px.
- **Command palette:** the search and command surface, opened from the spine or keyboard.

### Spread (signature)
Two facing pages with gutter shading. Left page carries the overview (week list, dashboard figures), right page the detail (day plan, projects). On a phone a segmented page switcher sits above a snap scroller.

### Ribbon marker (signature)
A 14px marigold band with a soft horizontal sheen (ribbon-2 to ribbon to ribbon-2), hanging in the right margin from the week header through each past day and ending in a forked tail with a small drop shadow on today's row. It appears only on the current week.

### Task rows and the dye checkbox
- **Week variant:** 13px title, a 14px square checkbox, planned start or duration in figures at the right, a 3px dye tick in the left margin on hover. Hover reveals the play button on desktop.
- **Day variant:** 14px title over a meta line (dye swatch and section name, schedule glyph, doc count, logged or running time), hairline below. A running task gets a ribbon-wash band and live ribbon-ink figures.
- **Checkbox:** a square with 3px corners and a 1.5px border in the section's deep dye; unchecked it holds a 25% dye wash (55% on hover); checked it fills with the deep dye and shows a paper check. Done titles go ink-3 with a strikethrough.
- **Editing:** clicking a title opens the task editor in an anchored popover. Tasks drag onto day rows, which light up with ribbon-wash and a 1.5px ribbon-2 inset.

### Popovers
The edit surface for tasks, projects and settings: paper, rule border, 8px corners, 12px padding, lift shadow, a 160ms pop in from 3px above. Forms inside stack 8px apart and end with ghost secondary actions on the left and a primary Save on the right.

### Timer chip
The running timer is a short length of ribbon on the cloth: vertical on the desktop spine (task name set vertically, figures, stop), horizontal in the phone bar. Dark warm ink on marigold. Hidden when nothing runs.

### Charts
All charts sit on the page with a rule-strong baseline, no frame, one tooltip (ink, paper text, 5px, lift) on hover, focus and touch, and an sr-only data table or labels.
- **Daily bars:** seven columns of logged time in the cloth bar color, today in ribbon-2, each with the planned amount as a dashed rule-strong outline behind it. Only the peak day prints its value; weekday labels below, today in ribbon-ink.
- **Ranked bars:** one row per section or task, sorted: dye swatch and name, a 12px bar in the item's dye (55% dye mixed with deep), duration in figures and share percentage in ink-3. Names and values are always printed.
- **Heatmap:** sixteen weeks as columns of square cells on the single heat ramp, today ringed in ribbon-2, future days hidden, a Less to More key.
- **Project progress:** a 10px fully rounded rod on paper-3, filled with the section's deep dye (ribbon-2 when complete), with paper ticks at 25, 50 and 75%. Above it the name, section, and the percentage at 24px figures; below it units done of target, this week's gain, and a pace line that turns danger when behind.

### Named Rules
**The Popover Edit Rule.** Things are edited where they sit, in an anchored popover. No modal dialogs and no separate detail pages for tasks or projects.

**The Printed Value Rule.** Every chart prints names and values as text; color alone never carries the reading, and multi-series charts that rely on telling dyes apart are not built.

## Do's and Don'ts

### Do:
- **Do** take every color from the tokens; set `--dye` and `--dye-deep` from a section and read those, never a specific dye.
- **Do** set every time, duration, count and percentage in the figures style (JetBrains Mono, tabular).
- **Do** name blocks with the 11px uppercase rubric on a rule-strong hairline.
- **Do** keep UI transitions at 150 to 250ms with the ease-out curve (cubic-bezier(0.16, 1, 0.3, 1)), and let reduced motion cancel them.
- **Do** edit in anchored popovers and add with inline quick-add lines.
- **Do** keep copy terse: one or two words per label, no instructional sentences, no em dashes, none of the phrases blocked by scripts/copy-lint.mjs.
- **Do** keep charts to one hue (cloth green, ribbon for today) or one bar per labeled row.

### Don't:
- **Don't** use marigold for anything that is not "now": not brand fills, not secondary buttons, not decoration.
- **Don't** put cards, boxes or drop shadows on rows, blocks or charts on the page; use rules and space.
- **Don't** build a chart whose series are told apart only by adjacent section dyes, or that omits printed names and values.
- **Don't** warm the paper toward cream or add a texture other than the dot grid.
- **Don't** show a product name or wordmark; the book mark is the only identity.
- **Don't** use the default Tailwind palette; it is switched off.
- **Don't** use em dashes, stock AI phrasing or explanatory copy in the UI.
