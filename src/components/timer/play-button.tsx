"use client";

import { Play, Square } from "lucide-react";
import { cx } from "@/lib/cx";
import { useTimer } from "./timer-context";
import type { RunningTimer } from "@/server/queries/time";

export function PlayButton({
  task,
  section,
  className,
}: {
  task: { id: string; title: string };
  section: RunningTimer["section"];
  className?: string;
}) {
  const { running, start, stop } = useTimer();
  const active = running?.task?.id === task.id;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (active) stop();
        else start({ task, section });
      }}
      aria-label={active ? `Stop timer on ${task.title}` : `Start timer on ${task.title}`}
      title={active ? "Stop" : "Start timer"}
      className={cx(
        "grid size-7 shrink-0 place-items-center rounded-xs transition-[background-color,color,opacity] duration-150",
        active
          ? "bg-ribbon text-on-ribbon hover:bg-ribbon-2"
          : "text-ink-3 hover:bg-paper-3 hover:text-ink",
        className,
      )}
    >
      {active ? (
        <Square className="size-3" fill="currentColor" strokeWidth={0} />
      ) : (
        <Play className="size-3.5 translate-x-px" fill="currentColor" strokeWidth={0} />
      )}
    </button>
  );
}
