"use client";

import Link from "next/link";
import { Square } from "lucide-react";
import { formatClock } from "@/lib/time";
import { cx } from "@/lib/cx";
import { useElapsed, useTimer } from "./timer-context";

/**
 * The running timer in marigold (it is what runs now): a vertical chip on the
 * desktop spine, a full-width strip above the phone bar. Hidden when nothing runs.
 */
export function TimerChip({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const { running, stop } = useTimer();
  const elapsed = useElapsed(running?.startedAt ?? null);
  if (!running) return null;
  const label = running.task?.title ?? running.section.name;

  if (orientation === "vertical") {
    return (
      <div className="flex w-12 flex-col items-center gap-1.5 rounded-sm bg-ribbon px-1 pb-1.5 pt-2.5 text-on-ribbon shadow-[0_2px_6px_oklch(0.15_0.05_70/0.35)]">
        <Link
          href={`/s/${running.section.slug}`}
          title={label}
          className="max-h-36 truncate text-2xs font-medium [writing-mode:vertical-rl] hover:underline"
        >
          {label}
        </Link>
        <span className="figures text-[0.625rem] leading-none tracking-[-0.02em]" aria-live="off">
          {formatClock(elapsed)}
        </span>
        <StopButton onStop={stop} />
      </div>
    );
  }

  return (
    <div className="flex h-11 items-center gap-2.5 bg-ribbon pl-4 pr-2 text-on-ribbon" aria-live="off">
      <span aria-hidden className="size-2 shrink-0 animate-pulse rounded-full bg-on-ribbon" />
      <Link href={`/s/${running.section.slug}`} className="min-w-0 flex-1 truncate text-sm font-semibold">
        {label}
      </Link>
      <span className="figures shrink-0 text-sm font-medium">{formatClock(elapsed)}</span>
      <StopButton onStop={stop} />
    </div>
  );
}

function StopButton({ onStop }: { onStop: () => void }) {
  return (
    <button
      type="button"
      onClick={onStop}
      aria-label="Timer stoppen"
      title="Timer stoppen"
      className={cx(
        "grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-[oklch(0.22_0.04_70/0.12)] lg:size-8",
      )}
    >
      <Square className="size-3.5" fill="currentColor" strokeWidth={0} />
    </button>
  );
}
