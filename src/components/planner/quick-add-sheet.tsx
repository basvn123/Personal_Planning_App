"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Sheet, usePhone } from "@/components/ui/sheet";
import * as Dialog from "@radix-ui/react-dialog";
import { createTask } from "@/server/actions/tasks";
import { useUi, type NewTask } from "@/lib/ui-store";
import { parseQuickAdd } from "@/lib/quick-add";
import { formatDay, formatMinutes } from "@/lib/time";
import { dyeVars } from "@/lib/dyes";
import { DayChips, DurationChips, FieldGroup, SectionChips, TimeField } from "./task-fields";

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
export function QuickAddSheet({ sections, today }: { sections: Section[]; today: string }) {
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

  // Each opening starts from where you are: the tapped day, the day in view, the section you are in.
  useEffect(() => {
    if (!open) return;
    const { addPreset, planner } = useUi.getState();
    const slug = pathname.match(/^\/s\/([^/]+)/)?.[1];
    const here = sections.find((s) => s.slug === slug)?.id;
    setTitle("");
    setSectionId(addPreset?.sectionId ?? planner?.sectionId ?? here ?? lastSection(sections.map((s) => s.id)));
    setDay(addPreset && "day" in addPreset ? (addPreset.day ?? null) : (planner?.day ?? today));
    setTime("");
    setMinutes(null);
    setError(null);
  }, [open, pathname, sections, today]);

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
    const task: NewTask = {
      title: name,
      sectionId,
      plannedDate: day,
      plannedStart: day ? time || null : null,
      plannedMinutes: day ? minutes : null,
    };
    setOpen(false);
    try {
      localStorage.setItem("last-section", sectionId);
    } catch {}
    const { planner, showToast } = useUi.getState();
    const where = day ? (day === today ? "vandaag" : formatDay(day, "EEEE d MMM")) : "to-do";
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
        <DayChips value={day} onChange={setDay} today={today} />
      </FieldGroup>

      {day && (
        <>
          <FieldGroup label="Duur">
            <DurationChips value={minutes} onChange={setMinutes} />
          </FieldGroup>
          <FieldGroup label="Om">
            <TimeField value={time} onChange={setTime} />
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
          {day ? (day === today ? "vandaag" : formatDay(day, "EEEEEE d")) : "to-do"}
          {day && time ? ` ${time}` : ""}
          {day && minutes ? ` · ${formatMinutes(minutes)}` : ""}
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
          className="fixed left-1/2 top-[12vh] z-50 max-h-[80vh] w-[min(30rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-y-auto rounded-lg border border-rule bg-paper p-5 text-ink shadow-lift outline-none data-[state=open]:animate-[rise_180ms_var(--ease-out)]"
        >
          <Dialog.Title className="sr-only">Activiteit toevoegen</Dialog.Title>
          {form}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
