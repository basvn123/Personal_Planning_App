"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Archive, Minus, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, IconButton, inputClass } from "@/components/ui/button";
import { archiveProject, logProgress, updateProject } from "@/server/actions/projects";
import type { ProjectProgress } from "@/server/queries/dashboard";
import { pace } from "@/lib/progress";
import { formatDay } from "@/lib/time";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function ProjectCard({ project: p, today }: { project: ProjectProgress; today: string }) {
  const [done, setDone] = useState(p.done);
  useEffect(() => setDone(p.done), [p.done]);
  const [pending, run] = useTransition();
  const stats = pace({ ...p, done }, today);

  function log(units: number) {
    setDone((d) => d + units);
    run(async () => {
      try {
        await logProgress(p.id, units);
      } catch {
        setDone((d) => d - units);
      }
    });
  }

  let paceLine: string;
  if (stats.complete) paceLine = "Complete";
  else if (stats.onTrack === false && stats.needPerWeek !== null)
    paceLine = `Needs ${fmt(Math.ceil(stats.needPerWeek * 10) / 10)}/week to finish by ${formatDay(p.dueDate!, "d MMM")}`;
  else if (stats.eta) paceLine = `On pace for ${formatDay(stats.eta, stats.eta.slice(0, 4) === today.slice(0, 4) ? "d MMM" : "d MMM yyyy")}`;
  else paceLine = "No momentum yet";

  return (
    <article style={dyeVars(p.section.color)} className="border-b border-rule py-4">
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium text-ink">{p.name}</h3>
          <Link href={`/s/${p.section.slug}`} className="inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink-2">
            <span className="size-2 rounded-[2px] bg-[var(--dye)]" />
            {p.section.name}
          </Link>
        </div>
        <span className="figures text-xl font-medium leading-none text-ink">
          {Math.floor(stats.percent)}
          <span className="text-sm text-ink-3">%</span>
        </span>
      </header>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={p.targetUnits}
        aria-valuenow={done}
        aria-label={`${p.name}: ${fmt(done)} of ${fmt(p.targetUnits)} ${p.unitLabel}`}
        className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-paper-3"
      >
        <span
          className={cx(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out",
            stats.complete ? "bg-ribbon-2" : "bg-[var(--dye-deep)]",
          )}
          style={{ width: `${stats.percent}%` }}
        />
        {[25, 50, 75].map((m) => (
          <span key={m} aria-hidden className="absolute inset-y-0 w-0.5 bg-paper" style={{ left: `${m}%` }} />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="figures text-ink-2">
          {fmt(done)} / {fmt(p.targetUnits)} {p.unitLabel}
        </span>
        {p.last7 > 0 && <span className="figures text-ink-2">+{fmt(p.last7)} this week</span>}
        <span className={cx(stats.onTrack === false ? "text-danger" : "text-ink-3")}>{paceLine}</span>
        <span className="ml-auto flex items-center gap-0.5">
          <IconButton label={`Remove one ${p.unitLabel}`} className="size-7" disabled={pending || done <= 0} onClick={() => log(-1)}>
            <Minus className="size-3.5" strokeWidth={2} />
          </IconButton>
          <button
            type="button"
            onClick={() => log(1)}
            disabled={pending}
            aria-label={`Add one ${p.unitLabel}`}
            className="inline-flex h-7 items-center gap-1 rounded-xs bg-cloth px-2 text-xs font-medium text-cloth-ink transition-colors hover:bg-cloth-3"
          >
            <Plus className="size-3.5" strokeWidth={2} />1
          </button>
          <ProjectSettings project={p} />
        </span>
      </div>
    </article>
  );
}

function ProjectSettings({ project: p }: { project: ProjectProgress }) {
  const [name, setName] = useState(p.name);
  const [target, setTarget] = useState(String(p.targetUnits));
  const [unit, setUnit] = useState(p.unitLabel);
  const [due, setDue] = useState(p.dueDate ?? "");
  const [open, setOpen] = useState(false);
  const [pending, run] = useTransition();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="ml-1 h-7 rounded-xs px-1.5 text-xs text-ink-3 hover:bg-paper-3 hover:text-ink">Edit</PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await updateProject(p.id, { name, targetUnits: Number(target), unitLabel: unit, dueDate: due || null });
              setOpen(false);
            });
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" className={inputClass} />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min={1} step="any" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target" className={cx(inputClass, "figures")} />
            <input value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Unit" className={inputClass} />
          </div>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" className={cx(inputClass, "figures")} />
          <div className="flex items-center gap-2 pt-1">
            <Button variant="ghost" disabled={pending} onClick={() => run(() => archiveProject(p.id))}>
              <Archive className="size-3.5" strokeWidth={1.75} />
              Archive
            </Button>
            <Button type="submit" variant="primary" className="ml-auto" disabled={pending}>
              Save
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
