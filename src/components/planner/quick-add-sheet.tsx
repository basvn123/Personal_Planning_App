"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Sheet, usePhone } from "@/components/ui/sheet";
import * as Dialog from "@radix-ui/react-dialog";
import { createTask, createTasks } from "@/server/actions/tasks";
import { MonthCalendar } from "@/components/ui/month-calendar";
import { useUi, type NewTask } from "@/lib/ui-store";
import { parseQuickAdd } from "@/lib/quick-add";
import { endClock, formatDay, formatMinutes, shiftDay, weekDays } from "@/lib/time";
import { dyeVars } from "@/lib/dyes";
import { Chip, DayChips, DurationChips, FieldGroup, SectionChips, TimeRangeField } from "./task-fields";

type Section = { id: string; name: string; slug: string; color: string };

function lastSection(ids: string[]) {
  try {
    const v = localStorage.getItem("last-section");
    if (v && ids.includes(v)) return v;
  } catch {}
  return ids[0] ?? "";
}

/**
 * Add an activity from anywhere: a sheet on the phone, a centred panel on the
 * desktop. Day, time and duration are set right here, not afterwards. The title
 * also understands quick-add words ("#study morgen 14:00 45m") for fast typists.
 */
export function QuickAddSheet({
  sections,
  today,
  weekStart = 1,
}: {
  sections: Section[];
  today: string;
  weekStart?: 0 | 1;
}) {
  const open = useUi((s) => s.addOpen);
  const setOpen = useUi((s) => s.setAddOpen);
  const router = useRouter();
  const pathname = usePathname();
  const phone = usePhone();
  const [, start] = useTransition();

  const [title, setTitle] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [day, setDay] = useState<string | null>(today);
  const [time, setTime] = useState("");
  const [minutes, setMinutes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Several days at once: the same activity is added to every picked day.
  const [multi, setMulti] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  // Each opening starts from where you are: the tapped day, the day in view, the section you are in.
  useEffect(() => {
    if (!open) return;
    const { addPreset, planner } = useUi.getState();
    const slug = pathname.match(/^\/s\/([^/]+)/)?.[1];
    const here = sections.find((s) => s.slug === slug)?.id;
    setTitle("");
    setSectionId(addPreset?.sectionId ?? planner?.sectionId ?? here ?? lastSection(sections.map((s) => s.id)));
    setDay(addPreset && "day" in addPreset ? (addPreset.day ?? null) : (planner?.day ?? today));
    setTime(addPreset?.time ?? "");
    setMinutes(addPreset?.time ? 60 : null);
    setError(null);
    setMulti(false);
    setPicked([]);
  }, [open, pathname, sections, today]);

  function pickSingle(d: string | null) {
    setMulti(false);
    setDay(d);
  }

  function startMulti() {
    if (multi) return pickSingle(picked[0] ?? today);
    setMulti(true);
    setPicked(day ? [day] : [today]);
    setError(null);
  }

  function toggleDay(d: string) {
    setPicked((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));
    setError(null);
  }

  // Quick-add words in the title fill the fields as you type; the chips stay the source of truth.
  const parsed = useMemo(() => parseQuickAdd(title, today, sections), [title, today, sections]);
  useEffect(() => {
    if (parsed.sectionId) setSectionId(parsed.sectionId);
    if (parsed.plannedDate !== undefined) setDay(parsed.plannedDate);
    if (parsed.plannedStart) setTime(parsed.plannedStart);
    if (parsed.plannedMinutes) setMinutes(parsed.plannedMinutes);
  }, [parsed.sectionId, parsed.plannedDate, parsed.plannedStart, parsed.plannedMinutes]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = parsed.title.trim();
    if (!name) return setError("Geef het een naam.");
    if (!sectionId) return setError("Kies een sectie.");
    if (multi && picked.length === 0) return setError("Tik minstens één dag aan.");
    const dates = multi ? picked : [day];
    const tasks: NewTask[] = dates.map((d) => ({
      title: name,
      sectionId,
      plannedDate: d,
      plannedStart: d ? time || null : null,
      plannedMinutes: d ? minutes : null,
    }));
    setOpen(false);
    try {
      localStorage.setItem("last-section", sectionId);
    } catch {}
    const { planner, showToast } = useUi.getState();

    if (tasks.length > 1) {
      // On a planner page the ones it shows appear at once; one save covers all days.
      if (planner) return planner.addMany(tasks);
      start(async () => {
        try {
          await createTasks(tasks);
          showToast(`Toegevoegd op ${tasks.length} dagen`);
          router.refresh();
        } catch {
          showToast("Niet opgeslagen, probeer opnieuw");
        }
      });
      return;
    }

    const task = tasks[0];
    const d = task.plannedDate;
    const where = d ? (d === today ? "vandaag" : formatDay(d, "EEEE d MMM")) : "to-do";
    // On a planner page that shows this task, it appears at once; elsewhere it saves and the page refreshes.
    if (planner?.add(task)) {
      showToast(`Toegevoegd aan ${where}`);
      return;
    }
    start(async () => {
      try {
        await createTask(task);
        showToast(`Toegevoegd aan ${where}`);
        router.refresh();
      } catch {
        showToast("Niet opgeslagen, probeer opnieuw");
      }
    });
  }

  const anchor = picked[0] ?? day ?? today;
  const presets: { label: string; days: string[] }[] = [
    { label: "Werkdagen", days: weekDays(anchor, 1).slice(0, 5) },
    { label: "Hele week", days: weekDays(anchor, weekStart) },
    { label: `7 dagen vanaf ${formatDay(anchor, "EEEEEE d")}`, days: Array.from({ length: 7 }, (_, i) => shiftDay(anchor, i)) },
  ];
  const planned = multi ? picked.length > 0 : day !== null;

  const section = sections.find((s) => s.id === sectionId);
  const form = (
    <form onSubmit={submit} className="flex flex-col gap-5 pb-2">
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setError(null);
        }}
        placeholder="Wat ga je doen?"
        aria-label="Activiteit"
        maxLength={300}
        autoFocus
        enterKeyHint="done"
        className="w-full bg-transparent text-xl font-semibold tracking-[-0.02em] text-ink outline-none placeholder:text-ink-3"
      />

      <FieldGroup label="Wanneer">
        <DayChips value={day} onChange={pickSingle} today={today} multi={multi} onMulti={startMulti} />
      </FieldGroup>

      {multi && (
        <div className="flex flex-col gap-3 rounded-xl border border-rule bg-canvas p-3">
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <Chip key={p.label} on={p.days.length === picked.length && p.days.every((d) => picked.includes(d))} onClick={() => setPicked(p.days)}>
                {p.label}
              </Chip>
            ))}
            {picked.length > 0 && (
              <Chip on={false} onClick={() => setPicked([])}>
                Wissen
              </Chip>
            )}
          </div>
          <MonthCalendar start={anchor} today={today} weekStart={weekStart} selected={picked} onPick={toggleDay} label="Kies de dagen" />
          <p className="text-sm text-ink-2" aria-live="polite">
            {picked.length === 0
              ? "Tik de dagen aan waarop dit moet gebeuren."
              : `${picked.length} ${picked.length === 1 ? "dag" : "dagen"}: ${picked
                  .slice(0, 4)
                  .map((d) => formatDay(d, "EEEEEE d MMM"))
                  .join(", ")}${picked.length > 4 ? ` en nog ${picked.length - 4}` : ""}`}
          </p>
        </div>
      )}

      {planned && (
        <>
          <FieldGroup label="Van, tot">
            <TimeRangeField start={time} minutes={minutes} onStart={setTime} onMinutes={setMinutes} />
          </FieldGroup>
          <FieldGroup label="Duur">
            <DurationChips value={minutes} onChange={setMinutes} />
          </FieldGroup>
        </>
      )}

      <FieldGroup label="Sectie">
        <SectionChips sections={sections} value={sectionId} onChange={setSectionId} />
      </FieldGroup>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        style={section ? dyeVars(section.color) : undefined}
        className="flex h-12 items-center justify-center gap-2 rounded-md bg-cloth text-md font-semibold text-cloth-ink transition-colors active:bg-cloth-3 lg:h-10 lg:text-base"
      >
        Toevoegen
        <span className="figures text-sm font-normal text-cloth-ink-2">
          {multi
            ? `op ${picked.length} ${picked.length === 1 ? "dag" : "dagen"}`
            : day
              ? day === today
                ? "vandaag"
                : formatDay(day, "EEEEEE d")
              : "to-do"}
          {planned && time ? ` ${time}${minutes ? ` tot ${endClock(time, minutes)}` : ""}` : ""}
          {planned && minutes && !time ? ` · ${formatMinutes(minutes)}` : ""}
        </span>
      </button>
    </form>
  );

  if (phone) {
    return (
      <Sheet open={open} onOpenChange={setOpen} title="Activiteit toevoegen">
        {form}
      </Sheet>
    );
  }
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[oklch(0.15_0.02_163/0.35)] data-[state=open]:animate-[fade_150ms_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-50 max-h-[80vh] w-[min(30rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-y-auto rounded-xl border border-rule bg-card p-5 text-ink shadow-lift outline-none data-[state=open]:animate-[rise_180ms_var(--ease-out)]"
        >
          <Dialog.Title className="sr-only">Activiteit toevoegen</Dialog.Title>
          {form}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
