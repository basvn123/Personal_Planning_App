import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Spread } from "@/components/shell/spread";
import { Ribbon } from "@/components/planner/ribbon";
import { PlannerProvider } from "@/components/planner/planner-context";
import { WeekList } from "@/components/planner/week-list";
import { DayPlan } from "@/components/planner/day-plan";
import { getDailyTotals, getSections, getSettings } from "@/server/queries/core";
import { getOpenBacklog, getTasksInRange } from "@/server/queries/tasks";
import { getEntriesInRange } from "@/server/queries/time";
import { HORIZON_DAYS, materializeSchedules } from "@/server/materialize";
import { formatDay, formatDuration, isoWeekNumber, localDate, shiftDay, weekDays } from "@/lib/time";

export const metadata: Metadata = { title: "Week" };

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; day?: string }>;
}) {
  const [{ d, day }, settings, sections] = await Promise.all([searchParams, getSettings(), getSections()]);
  const today = localDate(new Date(), settings.timezone);
  const anchor = d && DAY_RE.test(d) ? d : day && DAY_RE.test(day) ? day : today;
  const days = weekDays(anchor, settings.weekStart === 0 ? 0 : 1);
  // Strict schedules: make sure every viewed week (and the next eight) is generated.
  const horizon = shiftDay(today, HORIZON_DAYS);
  await materializeSchedules(today, days[6] > horizon ? days[6] : horizon);
  const [logged, weekTasks, entries, backlog] = await Promise.all([
    getDailyTotals(days[0], days[6]),
    getTasksInRange(days[0], days[6]),
    getEntriesInRange(days[0], days[6]),
    getOpenBacklog(),
  ]);
  const tasks = [...weekTasks, ...backlog];
  const weekLogged = days.reduce((sum, x) => sum + (logged[x] ?? 0), 0);
  const weekPlanned = weekTasks.reduce((sum, t) => sum + (t.plannedMinutes ?? 0) * 60, 0);
  const isThisWeek = days.includes(today);
  const selected = day && days.includes(day) ? day : isThisWeek ? today : days[0];

  const left = (
    <div className="flex min-h-full flex-col">
      <header className="relative flex items-end gap-4 px-5 pb-4 pt-6 pr-11 lg:px-8 lg:pr-14">
        {isThisWeek && <Ribbon kind="through" />}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-[-0.02em]">Week {isoWeekNumber(days[0])}</h1>
          <p className="text-sm text-ink-2">
            {formatDay(days[0], "d MMM")} to {formatDay(days[6], "d MMM yyyy")}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <WeekNav href={`/week?d=${shiftDay(days[0], -7)}`} label="Previous week">
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </WeekNav>
          {!isThisWeek && (
            <Link
              href="/week"
              className="h-8 rounded-sm px-2.5 text-sm leading-8 text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
            >
              Today
            </Link>
          )}
          <WeekNav href={`/week?d=${shiftDay(days[0], 7)}`} label="Next week">
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </WeekNav>
        </div>
      </header>

      <WeekList days={days} logged={logged} />

      <footer className="flex items-baseline justify-end gap-5 px-5 py-3 pr-11 lg:px-8 lg:pr-14">
        {weekPlanned > 0 && (
          <span className="flex items-baseline gap-2">
            <span className="text-2xs uppercase tracking-[0.08em] text-ink-3">Planned</span>
            <span className="figures text-base text-ink-2">{formatDuration(weekPlanned)}</span>
          </span>
        )}
        <span className="flex items-baseline gap-2">
          <span className="text-2xs uppercase tracking-[0.08em] text-ink-3">Logged</span>
          <span className="figures text-md font-medium">{formatDuration(weekLogged)}</span>
        </span>
      </footer>
    </div>
  );

  return (
    <PlannerProvider
      initialTasks={tasks}
      sections={sections.map(({ id, name, slug, color }) => ({ id, name, slug, color }))}
      today={today}
      initialDay={selected}
    >
      <Spread
        left={left}
        right={<DayPlan days={days} logged={logged} entries={entries} />}
        leftLabel={`Week ${isoWeekNumber(days[0])}`}
        rightLabel="Day"
      />
    </PlannerProvider>
  );
}

function WeekNav({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="grid size-8 place-items-center rounded-sm text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
    >
      {children}
    </Link>
  );
}
