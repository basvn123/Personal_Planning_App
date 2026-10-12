"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Sheet } from "@/components/ui/sheet";
import { inputClass } from "@/components/ui/button";
import { createTask } from "@/server/actions/tasks";
import { useUi } from "@/lib/ui-store";
import { dyeVars } from "@/lib/dyes";
import { formatDay, formatMinutes, shiftDay } from "@/lib/time";
import { cx } from "@/lib/cx";

type Section = { id: string; name: string; slug: string; color: string };

const DURATIONS = [15, 30, 45, 60, 90, 120];

function lastSection(ids: string[]) {
  try {
    const v = localStorage.getItem("last-section");
    if (v && ids.includes(v)) return v;
  } catch {}
  return ids[0] ?? "";
}

/** Phone: add an activity from any page, with big targets instead of quick-add syntax. */
export function QuickAddSheet({ sections, today }: { sections: Section[]; today: string }) {
  const open = useUi((s) => s.addOpen);
  const setOpen = useUi((s) => s.setAddOpen);
  const showToast = useUi((s) => s.showToast);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, start] = useTransition();

  const [title, setTitle] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [day, setDay] = useState<string | null>(today);
  const [time, setTime] = useState("");
  const [minutes, setMinutes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Each opening starts fresh, from where you are: the section you are in, the day you are looking at.
  useEffect(() => {
    if (!open) return;
    const slug = pathname.match(/^\/s\/([^/]+)/)?.[1];
    const here = sections.find((s) => s.slug === slug);
    const viewed = pathname === "/week" ? params.get("day") : null;
    setTitle("");
    setSectionId(here?.id ?? lastSection(sections.map((s) => s.id)));
    setDay(viewed && /^\d{4}-\d{2}-\d{2}$/.test(viewed) ? viewed : today);
    setTime("");
    setMinutes(null);
    setError(null);
  }, [open, pathname, params, sections, today]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = title.trim();
    if (!name) return setError("Geef het een naam.");
    if (!sectionId) return setError("Kies een sectie.");
    setOpen(false);
    try {
      localStorage.setItem("last-section", sectionId);
    } catch {}
    start(async () => {
      try {
        await createTask({ title: name, sectionId, plannedDate: day, plannedStart: time || null, plannedMinutes: minutes });
        showToast(day ? `Toegevoegd aan ${day === today ? "vandaag" : formatDay(day, "EEEE d MMM")}` : "Toegevoegd aan to-do");
        router.refresh();
      } catch {
        showToast("Niet opgeslagen");
      }
    });
  }

  const tomorrow = shiftDay(today, 1);
  const dayChoices: { value: string | null; label: string }[] = [
    { value: today, label: "Vandaag" },
    { value: tomorrow, label: "Morgen" },
    { value: null, label: "To-do" },
  ];
  const customDay = day !== null && day !== today && day !== tomorrow;

  return (
    <Sheet open={open} onOpenChange={setOpen} title="Activiteit toevoegen">
      <form onSubmit={submit} className="flex flex-col gap-5 pb-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Wat ga je doen?"
          aria-label="Activiteit"
          maxLength={300}
          autoFocus
          enterKeyHint="done"
          className="w-full bg-transparent text-xl font-semibold tracking-[-0.02em] text-ink outline-none placeholder:text-ink-3"
        />

        <Group label="Sectie">
          <div className="flex flex-wrap gap-1.5">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={s.id === sectionId}
                onClick={() => setSectionId(s.id)}
                style={dyeVars(s.color)}
                className={cx(
                  "h-10 rounded-sm px-3.5 text-sm font-medium transition-colors",
                  s.id === sectionId
                    ? "bg-[var(--dye)] text-ink shadow-[inset_0_0_0_1.5px_var(--dye-deep)]"
                    : "bg-[color-mix(in_oklch,var(--dye)_30%,var(--paper))] text-ink-2",
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </Group>

        <Group label="Wanneer">
          <div className="flex flex-wrap gap-1.5">
            {dayChoices.map((c) => (
              <Chip key={c.label} on={day === c.value} onClick={() => setDay(c.value)}>
                {c.label}
              </Chip>
            ))}
            <label
              className={cx(
                "relative inline-flex h-10 items-center rounded-sm px-3.5 text-sm font-medium",
                customDay ? "bg-cloth text-cloth-ink" : "bg-paper-3 text-ink-2",
              )}
            >
              {customDay ? formatDay(day!, "EEEEEE d MMM") : "Andere dag"}
              <input
                type="date"
                value={day ?? ""}
                aria-label="Andere dag"
                onChange={(e) => e.target.value && setDay(e.target.value)}
                className="absolute inset-0 opacity-0"
              />
            </label>
          </div>
        </Group>

        {day && (
          <>
            <Group label="Duur">
              <div className="grid grid-cols-6 gap-1.5">
                {DURATIONS.map((m) => (
                  <Chip key={m} small on={minutes === m} onClick={() => setMinutes(minutes === m ? null : m)}>
                    {formatMinutes(m)}
                  </Chip>
                ))}
              </div>
            </Group>
            <Group label="Om (niet verplicht)">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label="Begintijd"
                className={cx(inputClass, "figures h-10 w-36")}
              />
            </Group>
          </>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          className="h-12 rounded-md bg-cloth text-md font-semibold text-cloth-ink transition-colors active:bg-cloth-3"
        >
          Toevoegen
        </button>
      </form>
    </Sheet>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <span className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  on,
  small,
  onClick,
  children,
}: {
  on: boolean;
  small?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        "rounded-sm text-sm font-medium transition-colors",
        small ? "figures h-10 px-1" : "h-10 px-3.5",
        on ? "bg-cloth text-cloth-ink" : "bg-paper-3 text-ink-2",
      )}
    >
      {children}
    </button>
  );
}
