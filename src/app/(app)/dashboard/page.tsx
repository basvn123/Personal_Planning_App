import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight, CalendarRange, ChartColumn, Grid3x3, LayoutList, ListChecks, Target, Timer, Trophy } from "lucide-react";
import { Spread } from "@/components/shell/spread";
import { DailyBars } from "@/components/charts/daily-bars";
import { RankedBars } from "@/components/charts/ranked-bars";
import { Heatmap } from "@/components/charts/heatmap";
import { ProjectCard } from "@/components/projects/project-card";
import { NewProject } from "@/components/projects/new-project";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatStrip } from "@/components/ui/stat-strip";
import { WeekNav } from "@/components/ui/week-nav";
import { WeekJump } from "@/components/ui/week-jump";
import { pageBody } from "@/components/ui/page-body";
import { XpMeter } from "@/components/progress/xp-meter";
import { getXp } from "@/server/queries/xp";
import { getSections, getSettings } from "@/server/queries/core";
import {
  getDailySeries,
  getPlannedByDay,
  getProjects,
  getSectionTotals,
  getStreak,
  getTaskTotals,
} from "@/server/queries/dashboard";
import { formatDay, formatDuration, isoWeekNumber, localDate, shiftDay, weekDays } from "@/lib/time";
import { cx } from "@/lib/cx";

export const metadata: Metadata = { title: "Voortgang" };

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const [{ w }, settings, sections] = await Promise.all([searchParams, getSettings(), getSections()]);
  const today = localDate(new Date(), settings.timezone);
  const days = weekDays(w && DAY_RE.test(w) ? w : today, settings.weekStart === 0 ? 0 : 1);
  const [from, to] = [days[0], days[6]];
  const heatFrom = weekDays(shiftDay(today, -7 * 15), 1)[0];

  const [series, prevSeries, planned, bySection, byTask, heat, streak, projects, xp] = await Promise.all([
    getDailySeries(from, to),
    getDailySeries(shiftDay(from, -7), shiftDay(to, -7)),
    getPlannedByDay(from, to),
    getSectionTotals(from, to),
    getTaskTotals(from, to),
    getDailySeries(heatFrom, weekDays(today, 1)[6]),
    getStreak(today),
    getProjects(),
    getXp(),
  ]);

  const total = series.reduce((s, d) => s + d.seconds, 0);
  const prevTotal = prevSeries.reduce((s, d) => s + d.seconds, 0);
  const delta = total - prevTotal;
  const tasksTotal = Object.values(planned).reduce((s, d) => s + d.total, 0);
  const tasksDone = Object.values(planned).reduce((s, d) => s + d.done, 0);
  const isThisWeek = days.includes(today);

  const left = (
    <div className={pageBody}>
      <PageHeader
        title="Voortgang"
        info="dashboard"
        subtitle={`Week ${isoWeekNumber(from)}, ${formatDay(from, "d MMM")} tot ${formatDay(to, "d MMM")}`}
        actions={
          <WeekNav
            prev={`/dashboard?w=${shiftDay(from, -7)}`}
            next={`/dashboard?w=${shiftDay(from, 7)}`}
            now={isThisWeek ? undefined : "/dashboard"}
            nowLabel="Deze week"
            jump={<WeekJump target="dashboard" current={from} days={days} today={today} weekStart={settings.weekStart === 0 ? 0 : 1} />}
          />
        }
        className="pt-2"
      />

      <Card icon={Trophy} title="Level en XP" bodyClassName="flex flex-col gap-2">
        <XpMeter xp={xp} />
        <p className="text-xs text-ink-3">10 XP per afgevinkte taak en per uur gelogd, plus 5 per dag op rij.</p>
      </Card>

      <Card icon={CalendarRange} title={isThisWeek ? "Deze week" : `Week ${isoWeekNumber(from)}`}>
        <StatStrip
          items={[
            {
              label: "Gelogd",
              hint: "Tegenover de week ervoor",
              value: (
                <>
                  {formatDuration(total)}
                  {(prevTotal > 0 || total > 0) && (
                    <span
                      className={cx(
                        "ml-1.5 inline-flex items-center text-xs font-normal",
                        delta >= 0 ? "text-[var(--dye-moss-deep)]" : "text-ink-3",
                      )}
                    >
                      {delta >= 0 ? <ArrowUpRight className="size-3" strokeWidth={2} /> : <ArrowDownRight className="size-3" strokeWidth={2} />}
                      {formatDuration(Math.abs(delta))}
                    </span>
                  )}
                </>
              ),
            },
            {
              label: "Taken klaar",
              value: (
                <>
                  {tasksDone}
                  <span className="text-sm font-normal text-ink-3">/{tasksTotal}</span>
                </>
              ),
            },
            {
              label: streak.best > streak.current ? `Reeks (record ${streak.best})` : "Reeks",
              value: (
                <>
                  {streak.current}
                  <span className="ml-1 text-sm font-normal text-ink-3">{streak.current === 1 ? "dag" : "dagen"}</span>
                </>
              ),
            },
          ]}
        />
      </Card>

      <Card icon={ChartColumn} title="Per dag" bodyClassName="pt-6">
        <DailyBars
          today={today}
          data={series.map((d) => ({
            day: d.day,
            seconds: d.seconds,
            plannedSeconds: (planned[d.day]?.minutes ?? 0) * 60,
            done: planned[d.day]?.done ?? 0,
            total: planned[d.day]?.total ?? 0,
          }))}
        />
      </Card>

      <Card icon={LayoutList} title="Per sectie">
        {bySection.length === 0 ? (
          <NothingLogged />
        ) : (
          <RankedBars
            total={total}
            data={bySection.map((s) => ({ id: s.id, label: s.name, href: `/s/${s.slug}`, color: s.color, seconds: s.seconds }))}
          />
        )}
      </Card>

      <Card icon={ListChecks} title="Per taak">
        {byTask.length === 0 ? (
          <NothingLogged />
        ) : (
          <RankedBars
            total={total}
            data={byTask.map((t) => ({ id: t.id, label: t.title, sub: t.sectionName, color: t.color, seconds: t.seconds }))}
          />
        )}
      </Card>
    </div>
  );

  const right = (
    <div className={pageBody}>
      <Card
        icon={Target}
        title="Projecten"
        count={projects.length}
        action={<NewProject sections={sections.map(({ id, name }) => ({ id, name }))} />}
      >
        {projects.length === 0 ? (
          <EmptyState icon={Target} text="Een project telt eenheden af, bv. 200 lessen Italiaans. Maak er een met de plus." />
        ) : (
          <div className="divide-y divide-rule">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} today={today} />
            ))}
          </div>
        )}
      </Card>

      <Card icon={Grid3x3} title="Zestien weken" meta="hoe donkerder, hoe meer tijd">
        <div className="pt-1">
          <Heatmap days={heat} today={today} />
        </div>
      </Card>
    </div>
  );

  return <Spread left={left} right={right} leftLabel={isThisWeek ? "Deze week" : `Week ${isoWeekNumber(from)}`} rightLabel="Projecten" />;
}

function NothingLogged() {
  return <EmptyState icon={Timer} text="Deze week nog niets gelogd. Start een timer vanaf een taak in je planner." />;
}
