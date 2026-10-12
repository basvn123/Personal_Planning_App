"use client";

import Link from "next/link";
import { Square } from "lucide-react";
import { formatClock } from "@/lib/time";
import { cx } from "@/lib/cx";
import { useElapsed, useTimer } from "./timer-context";

/**
 * The running timer as a ribbon on the cloth: vertical on the desktop spine,
 * horizontal in the phone bar. Hidden when nothing runs.
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
    <div className="flex h-10 min-w-0 max-w-[40%] items-center gap-2 rounded-sm bg-ribbon pl-3 pr-1 text-on-ribbon">
      <span className="min-w-0 truncate text-xs font-medium">{label}</span>
      <span className="figures shrink-0 text-xs">{formatClock(elapsed)}</span>
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
        "grid size-8 shrink-0 place-items-center rounded-xs transition-colors hover:bg-[oklch(0.22_0.04_70/0.12)]",
      )}
    >
      <Square className="size-3.5" fill="currentColor" strokeWidth={0} />
    </button>
  );
}
