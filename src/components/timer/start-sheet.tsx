"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef } from "react";
import { Play } from "lucide-react";
import { Sheet, usePhone } from "@/components/ui/sheet";
import { useUi } from "@/lib/ui-store";
import { cx } from "@/lib/cx";
import { NowDoing, type NowTask } from "./now-doing";
import { useTimer } from "./timer-context";

type Section = { id: string; name: string; slug: string; color: string };

/**
 * One start button for time, from any page: it opens "what are you doing now"
 * (today's tasks, a section, or something new) and closes once a timer runs.
 */
export function StartSheet({ tasks, sections, today }: { tasks: NowTask[]; sections: Section[]; today: string }) {
  const open = useUi((s) => s.startOpen);
  const setOpen = useUi((s) => s.setStartOpen);
  const phone = usePhone();
  const { running } = useTimer();

  // Starting or switching closes the sheet; opening it on a running timer does not.
  const seen = useRef(running?.id);
  useEffect(() => {
    if (open && running?.id && running.id !== seen.current) setOpen(false);
    seen.current = running?.id;
  }, [running?.id, open, setOpen]);

  const body = <NowDoing tasks={tasks} sections={sections} today={today} />;
  if (phone) {
    return (
      <Sheet open={open} onOpenChange={setOpen} title="Tijd starten">
        <div className="pb-2">{body}</div>
      </Sheet>
    );
  }
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[oklch(0.15_0.02_163/0.35)] data-[state=open]:animate-[fade_150ms_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-50 max-h-[80vh] w-[min(28rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-y-auto rounded-xl bg-canvas p-3 text-ink shadow-lift outline-none data-[state=open]:animate-[rise_180ms_var(--ease-out)]"
        >
          <Dialog.Title className="sr-only">Tijd starten</Dialog.Title>
          {body}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Phone: a slim strip above the bar while no timer runs (the running timer takes its place). */
export function StartStrip() {
  const { running } = useTimer();
  const setOpen = useUi((s) => s.setStartOpen);
  if (running) return null;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex h-10 w-full items-center gap-2.5 border-t border-cloth-3/60 bg-cloth-2 pl-4 pr-3 text-left text-sm font-medium text-cloth-ink"
    >
      <span className="grid size-6 place-items-center rounded-full bg-cloth-ink text-cloth">
        <Play className="size-3 translate-x-px" fill="currentColor" strokeWidth={0} />
      </span>
      <span className="flex-1">Tijd starten</span>
      <span className="text-xs text-cloth-ink-2">Waar ben je mee bezig?</span>
    </button>
  );
}

/** Desktop spine: a play button that opens the same sheet. */
export function StartButton({ className }: { className?: string }) {
  const { running } = useTimer();
  const setOpen = useUi((s) => s.setStartOpen);
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={running ? "Overschakelen naar iets anders" : "Tijd starten"}
      title={running ? "Overschakelen" : "Tijd starten (T)"}
      className={cx(
        "grid size-10 place-items-center rounded-full border border-cloth-ink/40 text-cloth-ink transition-colors hover:bg-cloth-3/60",
        className,
      )}
    >
      <Play className="size-4 translate-x-px" fill="currentColor" strokeWidth={0} />
    </button>
  );
}
