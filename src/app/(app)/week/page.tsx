import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Repeat } from "lucide-react";
import { Spread } from "@/components/shell/spread";
import { Card, CardIcon } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatStrip } from "@/components/ui/stat-strip";
import { WeekNav } from "@/components/ui/week-nav";
import { pageBody } from "@/components/ui/page-body";
import { PlannerProvider } from "@/components/planner/planner-context";
import { WeekList } from "@/components/planner/week-list";
import { DayPlan } from "@/components/planner/day-plan";
import { getDailyTotals, getProjectOptions, getSections, getSettings } from "@/server/queries/core";
import { getOpenBacklog, getTasksInRange } from "@/server/queries/tasks";
import { getEntriesInRange } from "@/server/queries/time";
import { getXp } from "@/server/queries/xp";
import { XpMeter } from "@/components/progress/xp-meter";
import { HORIZON_DAYS, materializeSchedules } from "@/server/materialize";
import { formatDay, formatDuration, isoWeekNumber, localDate, shiftDay, weekDays } from "@/lib/time";

export const metadata: Metadata = { title: "Planner" };

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; day?: string }>;
}) {
  const [{ d, day }, settings, sections, projectOptions] = await Promise.all([
    searchParams,
    getSettings(),
    getSections(),
    getProjectOptions(),
  ]);
  const today = localDate(new Date(), settings.timezone);
  const anchor = d && DAY_RE.test(d) ? d : day && DAY_RE.test(day) ? day : today;
  const days = weekDays(anchor, settings.weekStart === 0 ? 0 : 1);
  // Strict schedules: make sure every viewed week (and the next eight) is generated.
  const horizon = shiftDay(today, HORIZON_DAYS);
  await materializeSchedules(settings.userId, today, days[6] > horizon ? days[6] : horizon);
  const [logged, weekTasks, entries, backlog, xp] = await Promise.all([
    getDailyTotals(days[0], days[6]),
    getTasksInRange(days[0], days[6]),
    getEntriesInRange(days[0], days[6]),
    getOpenBacklog(),
    getXp(),
  ]);
  const tasks = [...weekTasks, ...backlog];
  const weekLogged = days.reduce((sum, x) => sum + (logged[x] ?? 0), 0);
  const weekPlanned = weekTasks.reduce((sum, t) => sum + (t.plannedMinutes ?? 0) * 60, 0);
  const isThisWeek = days.includes(today);
  const selected = day && days.includes(day) ? day : isThisWeek ? today : days[0];

  const weekDone = weekTasks.filter((t) => t.status === "done").length;

  const left = (
    <div className={pageBody}>
      <Card bodyClassName="flex flex-col gap-4 pt-3">
        <PageHeader
          title={`Week ${isoWeekNumber(days[0])}`}
          info="week"
          subtitle={`${formatDay(days[0], "d MMM")} tot ${formatDay(days[6], "d MMM yyyy")}`}
          actions={
            <WeekNav
              prev={`/week?d=${shiftDay(days[0], -7)}`}
              next={`/week?d=${shiftDay(days[0], 7)}`}
              now={isThisWeek ? undefined : "/week"}
            />
          }
          className="px-0"
        />
        <StatStrip
          items={[
            { label: "Klaar", value: <>{weekDone}<span className="text-sm font-normal text-ink-3">/{weekTasks.length}</span></> },
            { label: "Gepland", value: formatDuration(weekPlanned) },
            { label: "Gelogd", value: formatDuration(weekLogged) },
          ]}
        />
        <XpMeter xp={xp} />
        <Link
          href="/schedules"
          className="flex min-h-12 items-center gap-3 rounded-lg bg-canvas px-3 py-2 transition-colors hover:bg-paper-3 active:bg-paper-3"
        >
          <CardIcon icon={Repeat} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-ink">Vaste planning</span>
            <span className="block truncate text-xs text-ink-3">Lessen en trainingen die elke week terugkomen</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-ink-3" strokeWidth={1.75} />
        </Link>
      </Card>

      <WeekList days={days} logged={logged} />
    </div>
  );

  return (
    <PlannerProvider
      initialTasks={tasks}
      sections={sections.map(({ id, name, slug, color }) => ({ id, name, slug, color }))}
      projects={projectOptions}
      today={today}
      initialDay={selected}
      scope={{ days }}
    >
      <Spread
        left={left}
        right={<DayPlan days={days} logged={logged} entries={entries} xp={xp} />}
        leftLabel="Week"
        rightLabel="Dag"
        // A phone opens on the day itself; the strip on top shows the rest of the week.
        initial="right"
      />
    </PlannerProvider>
  );
}
