"use client";

import { useEffect } from "react";
import { Flame, Trophy } from "lucide-react";
import { levelFor } from "@/lib/xp";
import { useUi } from "@/lib/ui-store";
import { cx } from "@/lib/cx";
import type { XpSummary } from "@/server/queries/xp";

/**
 * Level, points to the next level, and today's haul. Checking a task off adds
 * its points here at once; the server count takes over on the next refresh.
 */
export function XpMeter({ xp, className }: { xp: XpSummary; className?: string }) {
  const pending = useUi((s) => s.xpPending);
  const resetXp = useUi((s) => s.resetXp);
  useEffect(() => resetXp(), [xp.total, resetXp]);

  const total = Math.max(0, xp.total + pending);
  const today = Math.max(0, xp.today + pending);
  const lvl = levelFor(total);

  return (
    <section aria-label="Voortgang" className={cx("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Trophy className="size-3.5 text-cloth-3" strokeWidth={2} />
          Level {lvl.level}
        </span>
        <span className="text-sm text-ink-2">{lvl.title}</span>
        <span className="figures ml-auto text-xs text-ink-3">
          {lvl.into}/{lvl.need} XP
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Level ${lvl.level + 1}`}
        aria-valuemin={0}
        aria-valuemax={lvl.need}
        aria-valuenow={lvl.into}
        className="h-1.5 overflow-hidden rounded-full bg-paper-3"
      >
        <div className="h-full rounded-full bg-cloth-3 transition-[width] duration-500 ease-out" style={{ width: `${lvl.percent}%` }} />
      </div>
      <p className="flex flex-wrap gap-x-3 text-xs text-ink-3">
        <span className="figures">
          <span className={cx(today > 0 && "font-medium text-ink-2")}>+{today}</span> vandaag
        </span>
        <span className="figures">+{Math.max(0, xp.week + pending)} deze 7 dagen</span>
        {xp.streak > 0 && (
          <span className="figures inline-flex items-center gap-1">
            <Flame className="size-3" strokeWidth={2} />
            {xp.streak} {xp.streak === 1 ? "dag" : "dagen"} op rij
          </span>
        )}
      </p>
    </section>
  );
}
