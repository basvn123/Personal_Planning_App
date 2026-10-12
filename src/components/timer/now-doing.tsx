"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeftRight, Play, Plus, Square } from "lucide-react";
import { createTask, updateTask } from "@/server/actions/tasks";
import { coveringMinutes, orderForNow, planProgress } from "@/lib/now-doing";
import { dyeVars } from "@/lib/dyes";
import { endClock, formatClock, formatDuration, formatMinutes } from "@/lib/time";
import { useUi } from "@/lib/ui-store";
import { cx } from "@/lib/cx";
import { useElapsed, useTimer } from "./timer-context";

type Section = { id: string; name: string; slug: string; color: string };

export type NowTask = {
  id: string;
  title: string;
  status: string;
  plannedStart: string | null;
  plannedMinutes: number | null;
  section: Section;
};

/** Minutes since local midnight, refreshed every half minute (null until mounted). */
function useMinuteOfDay() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * "What am I doing now", at the top of the page. While a timer runs it shows what,
 * for how long and how that compares with the plan; going over the plan is shown,
 * never blocked, and one tap moves the plan to match. Otherwise it offers today's
 * open tasks (what is planned for now first), a bare section, or something new.
 */
export function NowDoing({ tasks, sections, today }: { tasks: NowTask[]; sections: Section[]; today: string }) {
  const { running } = useTimer();
  const [switching, setSwitching] = useState(false);
  // A new run closes the picker.
  useEffect(() => setSwitching(false), [running?.id]);

  return (
    <section
      aria-label="Nu bezig"
      className={cx(
        "rounded-xl border shadow-[0_1px_2px_oklch(0.2_0.02_258/0.04)]",
        running ? "border-ribbon-2/50 bg-ribbon-wash" : "border-rule bg-card",
      )}
    >
      {running && <Running tasks={tasks} onSwitch={() => setSwitching((v) => !v)} switching={switching} />}
      {(!running || switching) && (
        <Picker tasks={tasks} sections={sections} today={today} runningTaskId={running?.task?.id ?? null} framed={Boolean(running)} />
      )}
    </section>
  );
}

function Running({ tasks, onSwitch, switching }: { tasks: NowTask[]; onSwitch: () => void; switching: boolean }) {
  const router = useRouter();
  const { running, stop } = useTimer();
  const elapsed = useElapsed(running?.startedAt ?? null);
  const [saving, startSave] = useTransition();
  const [extended, setExtended] = useState<number | null>(null);
  if (!running) return null;

  const task = running.task;
  // The planner may know a newer plan than the timer (just edited); prefer it.
  const fresh = task ? tasks.find((t) => t.id === task.id) : undefined;
  const plannedMinutes = extended ?? fresh?.plannedMinutes ?? task?.plannedMinutes ?? null;
  const total = (task?.loggedBefore ?? 0) + elapsed;
  const plan = planProgress(total, plannedMinutes);
  const label = task?.title ?? running.section.name;

  function extend() {
    if (!task) return;
    const minutes = coveringMinutes(total + 15 * 60);
    setExtended(minutes);
    startSave(async () => {
      try {
        await updateTask(task.id, { plannedMinutes: minutes });
        useUi.getState().showToast(`Planning bijgewerkt naar ${formatMinutes(minutes)}`);
        router.refresh();
      } catch {
        setExtended(null);
        useUi.getState().showToast("Niet opgeslagen, probeer opnieuw");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2.5 px-4 py-3" style={dyeVars(running.section.color)}>
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-1.5 size-2.5 shrink-0 animate-pulse rounded-full bg-ribbon-2" />
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-medium uppercase tracking-[0.08em] text-ribbon-ink">Nu bezig</p>
          <p className="truncate text-md font-semibold leading-snug text-ink">{label}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
            <span className="size-2 shrink-0 rounded-[2px] bg-[var(--dye)]" />
            <span className="min-w-0 truncate">
              {running.section.name}
              {fresh?.plannedStart && (
                <span className="figures text-ink-3">
                  {`, gepland ${fresh.plannedStart.slice(0, 5)}${plannedMinutes ? ` tot ${endClock(fresh.plannedStart, plannedMinutes)}` : ""}`}
                </span>
              )}
            </span>
          </p>
        </div>
        <span className="figures shrink-0 pt-3 text-xl font-semibold tracking-[-0.02em] text-ink" aria-live="off">
          {formatClock(elapsed)}
        </span>
      </div>

      {plan.planned > 0 && (
        <div className="flex flex-col gap-1">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-paper-3" aria-hidden>
            <span
              className={cx("absolute inset-y-0 left-0 rounded-full", plan.over ? "bg-ribbon-2" : "bg-cloth-3")}
              style={{ width: `${plan.fill * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
            <span className="figures text-ink-2">
              {formatDuration(plan.logged)} van {formatDuration(plan.planned)} gepland
            </span>
            {plan.over > 0 && (
              <span className="figures font-medium text-ribbon-ink">{formatDuration(plan.over)} langer dan gepland</span>
            )}
          </div>
          {plan.over > 0 && task && (
            <button
              type="button"
              onClick={extend}
              disabled={saving}
              className="self-start rounded-full px-0 text-xs font-medium text-[var(--link)] hover:underline disabled:opacity-50"
            >
              Planning aanpassen naar {formatMinutes(coveringMinutes(total + 15 * 60))}
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={stop}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-ink text-sm font-semibold text-paper transition-colors hover:bg-ink-2 lg:h-9"
        >
          <Square className="size-3.5" fill="currentColor" strokeWidth={0} />
          Stoppen
        </button>
        <button
          type="button"
          onClick={onSwitch}
          aria-expanded={switching}
          className={cx(
            "flex h-10 flex-1 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors lg:h-9",
            switching ? "bg-cloth text-cloth-ink" : "bg-paper text-ink hover:bg-paper-3",
          )}
        >
          <ArrowLeftRight className="size-4" strokeWidth={2} />
          Iets anders
        </button>
      </div>
    </div>
  );
}

function Picker({
  tasks,
  sections,
  today,
  runningTaskId,
  framed,
}: {
  tasks: NowTask[];
  sections: Section[];
  today: string;
  runningTaskId: string | null;
  framed: boolean;
}) {
  const router = useRouter();
  const { start } = useTimer();
  const now = useMinuteOfDay();
  const [title, setTitle] = useState("");
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [, startSave] = useTransition();

  // Remember the section last used for something new.
  useEffect(() => {
    try {
      const v = localStorage.getItem("last-section");
      if (v && sections.some((s) => s.id === v)) setSectionId(v);
    } catch {}
  }, [sections]);

  const ordered = orderForNow(
    tasks.filter((t) => t.id !== runningTaskId),
    now ?? 0,
  ).slice(0, 5);
  const isNow = (t: NowTask) => {
    if (now === null || !t.plannedStart) return false;
    const [h, m] = t.plannedStart.split(":").map(Number);
    const s = h * 60 + m;
    return s <= now && now < s + Math.max(1, t.plannedMinutes ?? 0);
  };

  function startNew(e: React.FormEvent) {
    e.preventDefault();
    const name = title.trim();
    const section = sections.find((s) => s.id === sectionId);
    if (!name || !section) return;
    setTitle("");
    try {
      localStorage.setItem("last-section", section.id);
    } catch {}
    startSave(async () => {
      try {
        const id = await createTask({ title: name, sectionId: section.id, plannedDate: today, plannedStart: null, plannedMinutes: null });
        start({ task: { id, title: name, plannedMinutes: null, loggedBefore: 0 }, section });
        router.refresh();
      } catch {
        useUi.getState().showToast("Niet gestart, probeer opnieuw");
      }
    });
  }

  return (
    <div className={cx("flex flex-col gap-3 px-4 pb-3", framed ? "border-t border-ribbon-2/30 pt-3" : "pt-3.5")}>
      <p className="text-sm font-semibold text-ink">{framed ? "Overschakelen naar" : "Waar ben je nu mee bezig?"}</p>

      {ordered.length > 0 && (
        <ul className="-mx-1 flex flex-col">
          {ordered.map((t) => (
            <li key={t.id} style={dyeVars(t.section.color)}>
              <button
                type="button"
                onClick={() => start({ task: { id: t.id, title: t.title, plannedMinutes: t.plannedMinutes }, section: t.section })}
                className="flex min-h-11 w-full items-center gap-3 rounded-md px-1 text-left transition-colors hover:bg-paper-3 active:bg-paper-3"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--dye)_40%,var(--paper))] text-ink">
                  <Play className="size-3.5 translate-x-px" fill="currentColor" strokeWidth={0} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{t.title}</span>
                  <span className="block truncate text-xs text-ink-3">
                    {t.section.name}
                    {t.plannedStart
                      ? `, ${t.plannedStart.slice(0, 5)}${t.plannedMinutes ? ` tot ${endClock(t.plannedStart, t.plannedMinutes)}` : ""}`
                      : t.plannedMinutes
                        ? `, ${formatMinutes(t.plannedMinutes)}`
                        : ""}
                  </span>
                </span>
                {isNow(t) && (
                  <span className="shrink-0 rounded-full bg-ribbon-wash px-2 py-0.5 text-2xs font-semibold text-ribbon-ink">nu gepland</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={startNew} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={ordered.length ? "Of iets anders..." : "Typ wat je gaat doen"}
            aria-label="Nieuwe activiteit"
            maxLength={300}
            enterKeyHint="go"
            className="h-10 min-w-0 flex-1 rounded-md border border-rule-strong bg-paper px-3 text-base text-ink outline-none placeholder:text-ink-3 focus:border-cloth-3 lg:h-9 lg:text-sm"
          />
          <button
            type="submit"
            disabled={!title.trim() || !sectionId}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-cloth px-3 text-sm font-semibold text-cloth-ink transition-colors disabled:opacity-40 lg:h-9"
          >
            <Plus className="size-4" strokeWidth={2.25} />
            Start
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sectie voor iets nieuws">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === sectionId}
              onClick={() => setSectionId(s.id)}
              style={dyeVars(s.color)}
              className={cx(
                "inline-flex h-8 items-center rounded-sm px-2.5 text-xs font-medium transition-colors",
                s.id === sectionId
                  ? "bg-[var(--dye)] text-ink shadow-[inset_0_0_0_1.5px_var(--dye-deep)]"
                  : "bg-[color-mix(in_oklch,var(--dye)_30%,var(--paper))] text-ink-2",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
