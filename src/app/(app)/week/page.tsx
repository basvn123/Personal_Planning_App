import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Spread } from "@/components/shell/spread";
import { Ribbon } from "@/components/planner/ribbon";
import { getDailyTotals, getSections, getSettings } from "@/server/queries/core";
import { formatDay, formatDuration, isoWeekNumber, localDate, shiftDay, weekDays } from "@/lib/time";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";

export const metadata: Metadata = { title: "Week" };

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const [{ d }, settings, sections] = await Promise.all([searchParams, getSettings(), getSections()]);
  const today = localDate(new Date(), settings.timezone);
  const anchor = d && DAY_RE.test(d) ? d : today;
  const days = weekDays(anchor, settings.weekStart === 0 ? 0 : 1);
  const totals = await getDailyTotals(days[0], days[6]);
  const weekTotal = days.reduce((sum, day) => sum + (totals[day] ?? 0), 0);
  const todayIndex = days.indexOf(today);
  const isThisWeek = todayIndex >= 0;

  const left = (
    <div className="flex min-h-full flex-col">
      <header className="relative flex items-end gap-4 px-5 pb-4 pt-6 pr-12 lg:px-8 lg:pr-14">
        {isThisWeek && <Ribbon kind="through" />}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-[-0.02em]">
            Week {isoWeekNumber(days[0])}
          </h1>
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

      <ol className="flex flex-1 flex-col border-t border-rule-strong">
        {days.map((day, i) => {
          const isToday = day === today;
          const logged = totals[day] ?? 0;
          return (
            <li
              key={day}
              aria-current={isToday ? "date" : undefined}
              className={cx(
                "relative grid min-h-[4.75rem] flex-1 grid-cols-[3.5rem_1fr_auto] gap-3 border-b border-rule px-5 py-2.5 pr-12 lg:px-8 lg:pr-14",
                isToday && "bg-ribbon-wash/60",
                i >= 5 && "bg-paper-2/50",
              )}
            >
              {isThisWeek && i < todayIndex && <Ribbon kind="through" />}
              {isToday && <Ribbon kind="tail" />}
              <div className="flex flex-col leading-none">
                <span className={cx("text-2xs font-medium uppercase tracking-[0.08em]", isToday ? "text-ribbon-ink" : "text-ink-3")}>
                  {formatDay(day, "EEE")}
                </span>
                <span className="figures mt-1 text-xl font-medium text-ink">{formatDay(day, "d")}</span>
              </div>
              <div className="min-w-0" />
              <div className="figures pt-0.5 text-right text-sm text-ink-3">
                <span className={cx(logged > 0 && "text-ink-2")}>{formatDuration(logged)}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="flex items-baseline justify-end gap-3 px-5 py-3 pr-12 lg:px-8 lg:pr-14">
        <span className="text-xs uppercase tracking-[0.08em] text-ink-3">Logged</span>
        <span className="figures text-md font-medium">{formatDuration(weekTotal)}</span>
      </footer>
    </div>
  );

  const right = (
    <div className="flex min-h-full flex-col px-5 pb-8 pt-6 lg:px-8">
      <header>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{formatDay(today, "EEEE d MMMM")}</h2>
        <p className="figures text-sm text-ink-2">{formatDuration(totals[today] ?? 0)} logged</p>
      </header>

      <section aria-label="Sections" className="mt-8">
        <h3 className="border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">
          Sections
        </h3>
        {sections.length === 0 ? (
          <p className="py-6 text-sm text-ink-3">No sections yet.</p>
        ) : (
          <ul>
            {sections.map((s) => (
              <li key={s.id} className="border-b border-rule">
                <Link
                  href={`/s/${s.slug}`}
                  style={dyeVars(s.color)}
                  className="flex h-10 items-center gap-3 text-base text-ink transition-colors hover:text-ink"
                >
                  <span className="size-2.5 rounded-[2px] bg-[var(--dye)] ring-1 ring-[color-mix(in_oklch,var(--dye-deep)_30%,transparent)]" />
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );

  return <Spread left={left} right={right} leftLabel="Week" rightLabel="Today" />;
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
