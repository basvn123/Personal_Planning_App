import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { Spread } from "@/components/shell/spread";
import { ScheduleForm } from "@/components/schedules/schedule-form";
import { InfoButton } from "@/components/help/info-button";
import { db } from "@/db/client";
import { schedules, sections } from "@/db/schema";
import { describeRule, parseRule, WEEKDAY_CODES } from "@/lib/recurrence";
import { formatMinutes, localDate } from "@/lib/time";
import { getSections, getSettings } from "@/server/queries/core";
import { requireUserId } from "@/server/auth";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";

export const metadata: Metadata = { title: "Vaste planning" };

const DAY_SHORT = { MO: "ma", TU: "di", WE: "wo", TH: "do", FR: "vr", SA: "za", SU: "zo" } as const;
const LETTERS = { MO: "M", TU: "D", WE: "W", TH: "D", FR: "V", SA: "Z", SU: "Z" } as const;

export default async function SchedulesPage({ searchParams }: { searchParams: Promise<{ id?: string; new?: string }> }) {
  const [{ id, new: isNew }, allSections, settings] = await Promise.all([searchParams, getSections(), getSettings()]);
  const userId = await requireUserId();
  const rows = await db
    .select({
      id: schedules.id,
      title: schedules.title,
      rrule: schedules.rrule,
      startTime: schedules.startTime,
      durationMinutes: schedules.durationMinutes,
      active: schedules.active,
      sectionId: schedules.sectionId,
      sectionName: sections.name,
      sectionColor: sections.color,
    })
    .from(schedules)
    .innerJoin(sections, eq(sections.id, schedules.sectionId))
    .where(and(eq(schedules.userId, userId)))
    .orderBy(asc(schedules.startTime), asc(schedules.title));

  const selected = rows.find((r) => r.id === id);
  const today = localDate(new Date(), settings.timezone);
  const todayCode = WEEKDAY_CODES[(new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7];

  const left = (
    <div className="flex min-h-full flex-col px-5 pb-10 pt-6 lg:px-8">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-1.5 text-xl font-semibold tracking-[-0.02em]">
          Vaste planning
          <InfoButton topic="schedules" />
        </h1>
        <Link
          href="/schedules?new=1"
          className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-cloth px-3 text-sm font-medium text-cloth-ink transition-colors hover:bg-cloth-3"
        >
          <Plus className="size-4" strokeWidth={2} />
          Nieuw
        </Link>
      </header>
      <ul className="mt-6 border-t border-rule-strong">
        {rows.map((r) => {
          const rule = parseRule(r.rrule);
          return (
            <li key={r.id} className="border-b border-rule">
              <Link
                href={`/schedules?id=${r.id}`}
                aria-current={r.id === id ? "page" : undefined}
                style={dyeVars(r.sectionColor)}
                className={cx(
                  "-mx-2 grid grid-cols-[3.25rem_1fr_auto] items-start gap-3 rounded-xs px-2 py-3 transition-colors",
                  r.id === id ? "bg-ribbon-wash" : "hover:bg-paper-3/70",
                  !r.active && "opacity-55",
                )}
              >
                <span className="figures text-sm text-ink-2">
                  {r.startTime.slice(0, 5)}
                  <span className="block text-2xs text-ink-3">{formatMinutes(r.durationMinutes)}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base text-ink">{r.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-3">
                    <span className="size-2 rounded-[2px] bg-[var(--dye)]" />
                    {r.sectionName}
                    {!r.active && <span>· gepauzeerd</span>}
                  </span>
                </span>
                <span className="flex gap-0.5 pt-0.5" aria-label={describeRule(rule)}>
                  {WEEKDAY_CODES.map((d) => (
                    <span
                      key={d}
                      aria-hidden
                      className={cx(
                        "grid size-[1.125rem] place-items-center rounded-[3px] text-[0.625rem] font-medium leading-none",
                        rule.days.includes(d) ? "bg-[var(--dye)] text-ink" : "text-ink-3",
                      )}
                    >
                      {LETTERS[d]}
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 && (
        <p className="py-6 text-sm text-ink-3">Nog geen vaste afspraken.</p>
      )}
    </div>
  );

  const showForm = Boolean(selected) || isNew === "1";
  const right = showForm ? (
    <div className="px-5 pb-12 pt-6 lg:px-10">
      <ScheduleForm
        key={selected?.id ?? "new"}
        sections={allSections.map(({ id, name }) => ({ id, name }))}
        draft={
          selected
            ? {
                id: selected.id,
                title: selected.title,
                sectionId: selected.sectionId,
                recurrence: parseRule(selected.rrule),
                startTime: selected.startTime.slice(0, 5),
                durationMinutes: selected.durationMinutes,
                active: selected.active,
              }
            : {
                title: "",
                sectionId: allSections[0]?.id ?? "",
                recurrence: { start: today, until: null, interval: 1, days: [todayCode] },
                startTime: "09:00",
                durationMinutes: 60,
                active: true,
              }
        }
      />
    </div>
  ) : (
    <div className="px-5 pb-12 pt-6 lg:px-8">
      <h2 className="border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">
        Een gewone week
      </h2>
      {/* Phone: one row per day. Desktop: seven columns. */}
      <div className="mt-3 flex flex-col lg:grid lg:grid-cols-7 lg:gap-1.5">
        {WEEKDAY_CODES.map((d) => (
          <div key={d} className="flex min-w-0 flex-wrap items-start gap-1 border-b border-rule py-2 lg:flex-col lg:flex-nowrap lg:border-0 lg:py-0">
            <span
              className={cx(
                "w-8 shrink-0 pt-1 text-2xs font-medium uppercase tracking-[0.06em] lg:w-auto lg:self-stretch lg:pb-1 lg:pt-0 lg:text-center",
                d === todayCode ? "text-ribbon-ink" : "text-ink-3",
              )}
            >
              {DAY_SHORT[d]}
            </span>
            {rows
              .filter((r) => r.active && parseRule(r.rrule).days.includes(d))
              .map((r) => (
                <Link
                  key={r.id}
                  href={`/schedules?id=${r.id}`}
                  style={dyeVars(r.sectionColor)}
                  title={`${r.title}, ${r.startTime.slice(0, 5)}`}
                  className="flex min-w-0 max-w-full flex-col rounded-[3px] bg-[color-mix(in_oklch,var(--dye)_55%,var(--paper))] px-1.5 py-1 transition-colors hover:bg-[var(--dye)] max-lg:px-2"
                  aria-label={`${DAY_SHORT[d]}: ${r.title} om ${r.startTime.slice(0, 5)}`}
                >
                  <span className="figures text-[0.625rem] leading-3 text-ink-2">{r.startTime.slice(0, 5)}</span>
                  <span className="truncate text-xs leading-4 text-ink">{r.title}</span>
                </Link>
              ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Spread
      left={left}
      right={right}
      leftLabel="Vaste planning"
      rightLabel={selected ? "Bewerken" : "Nieuw"}
      initial={showForm ? "right" : "left"}
    />
  );
}
