import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Spread } from "@/components/shell/spread";
import { DailyBars } from "@/components/charts/daily-bars";
import { RankedBars } from "@/components/charts/ranked-bars";
import { Heatmap } from "@/components/charts/heatmap";
import { ProjectCard } from "@/components/projects/project-card";
import { NewProject } from "@/components/projects/new-project";
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

export const metadata: Metadata = { title: "Dashboard" };

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const [{ w }, settings, sections] = await Promise.all([searchParams, getSettings(), getSections()]);
  const today = localDate(new Date(), settings.timezone);
  const days = weekDays(w && DAY_RE.test(w) ? w : today, settings.weekStart === 0 ? 0 : 1);
  const [from, to] = [days[0], days[6]];
  const heatFrom = weekDays(shiftDay(today, -7 * 15), 1)[0];

  const [series, prevSeries, planned, bySection, byTask, heat, streak, projects] = await Promise.all([
    getDailySeries(from, to),
    getDailySeries(shiftDay(from, -7), shiftDay(to, -7)),
    getPlannedByDay(from, to),
    getSectionTotals(from, to),
    getTaskTotals(from, to),
    getDailySeries(heatFrom, weekDays(today, 1)[6]),
    getStreak(today),
    getProjects(),
  ]);

  const total = series.reduce((s, d) => s + d.seconds, 0);
  const prevTotal = prevSeries.reduce((s, d) => s + d.seconds, 0);
  const delta = total - prevTotal;
  const tasksTotal = Object.values(planned).reduce((s, d) => s + d.total, 0);
  const tasksDone = Object.values(planned).reduce((s, d) => s + d.done, 0);
  const isThisWeek = days.includes(today);

  const left = (
    <div className="flex min-h-full flex-col px-5 pb-12 pt-6 lg:px-8">
      <header className="flex items-end gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-[-0.02em]">Week {isoWeekNumber(from)}</h1>
          <p className="text-sm text-ink-2">
            {formatDay(from, "d MMM")} to {formatDay(to, "d MMM yyyy")}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <NavLink href={`/dashboard?w=${shiftDay(from, -7)}`} label="Previous week">
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </NavLink>
          {!isThisWeek && (
            <Link href="/dashboard" className="h-8 rounded-sm px-2.5 text-sm leading-8 text-ink-2 hover:bg-paper-3 hover:text-ink">
              This week
            </Link>
          )}
          <NavLink href={`/dashboard?w=${shiftDay(from, 7)}`} label="Next week">
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </NavLink>
        </div>
      </header>

      <dl className="mt-6 grid grid-cols-3 border-y border-rule-strong">
        <Figure label="Logged">
          {formatDuration(total)}
          {(prevTotal > 0 || total > 0) && (
            <span
              className={cx(
                "ml-2 inline-flex items-center text-xs font-normal",
                delta >= 0 ? "text-[var(--dye-moss-deep)]" : "text-ink-3",
              )}
              title="Against the week before"
            >
              {delta >= 0 ? <ArrowUpRight className="size-3" strokeWidth={2} /> : <ArrowDownRight className="size-3" strokeWidth={2} />}
              {formatDuration(Math.abs(delta))}
            </span>
          )}
        </Figure>
        <Figure label="Tasks done">
          {tasksDone}
          <span className="text-sm font-normal text-ink-3">/{tasksTotal}</span>
        </Figure>
        <Figure label="Streak">
          {streak.current}
          <span className="ml-1 text-sm font-normal text-ink-3">{streak.current === 1 ? "day" : "days"}</span>
          {streak.best > streak.current && <span className="ml-2 text-xs font-normal text-ink-3">best {streak.best}</span>}
        </Figure>
      </dl>

      <Block title="Per day">
        <div className="pt-8">
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
        </div>
      </Block>

      <Block title="Per section">
        {bySection.length === 0 ? (
          <Empty />
        ) : (
          <RankedBars
            total={total}
            data={bySection.map((s) => ({ id: s.id, label: s.name, href: `/s/${s.slug}`, color: s.color, seconds: s.seconds }))}
          />
        )}
      </Block>

      <Block title="Per task">
        {byTask.length === 0 ? (
          <Empty />
        ) : (
          <RankedBars
            total={total}
            data={byTask.map((t) => ({ id: t.id, label: t.title, sub: t.sectionName, color: t.color, seconds: t.seconds }))}
          />
        )}
      </Block>
    </div>
  );

  const right = (
    <div className="flex min-h-full flex-col px-5 pb-12 pt-6 lg:px-10">
      <div className="flex h-8 items-center justify-between border-b border-rule-strong">
        <h2 className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">Projects</h2>
        <NewProject sections={sections.map(({ id, name }) => ({ id, name }))} />
      </div>
      {projects.length === 0 ? (
        <p className="py-5 text-sm text-ink-3">Set a target, like 200 Italian lessons, and watch it fill.</p>
      ) : (
        projects.map((p) => <ProjectCard key={p.id} project={p} today={today} />)
      )}

      <Block title="Sixteen weeks">
        <div className="pt-3">
          <Heatmap days={heat} today={today} />
        </div>
      </Block>
    </div>
  );

  return <Spread left={left} right={right} leftLabel={`Week ${isoWeekNumber(from)}`} rightLabel="Projects" />;
}

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-r border-rule py-3 pl-3 first:pl-0 last:border-r-0">
      <dt className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{label}</dt>
      <dd className="figures flex items-baseline text-lg font-medium text-ink">{children}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="mt-9">
      <h2 className="border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="py-4 text-sm text-ink-3">Nothing logged this week.</p>;
}

function NavLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} className="grid size-8 place-items-center rounded-sm text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink">
      {children}
    </Link>
  );
}
