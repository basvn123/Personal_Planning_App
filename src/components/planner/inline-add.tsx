"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { parseQuickAdd } from "@/lib/quick-add";
import { formatDay, formatMinutes } from "@/lib/time";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";
import { usePlanner } from "./planner-context";

function rememberedSection(ids: string[]) {
  try {
    const v = localStorage.getItem("last-section");
    if (v && ids.includes(v)) return v;
  } catch {}
  return ids[0] ?? null;
}

/**
 * A ruled line you can write on. Understands "#section", days, "14:00" and "45m".
 * `day` is the default date; null adds to the backlog of `sectionId`.
 */
export function InlineAdd({
  day,
  sectionId: fixedSection,
  compact,
  placeholder = "Add a task",
  autoFocus,
  onDone,
}: {
  day: string | null;
  sectionId?: string;
  compact?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const { sections, today, add } = usePlanner();
  const [value, setValue] = useState("");
  const [fallback, setFallback] = useState<string | null>(fixedSection ?? null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!fixedSection) setFallback(rememberedSection(sections.map((s) => s.id)));
  }, [fixedSection, sections]);

  const parsed = useMemo(() => parseQuickAdd(value, today, sections), [value, today, sections]);
  const sectionId = parsed.sectionId ?? fallback;
  const section = sections.find((s) => s.id === sectionId);
  const date = parsed.plannedDate === undefined ? day : parsed.plannedDate;

  function submit() {
    if (!parsed.title || !sectionId) return;
    add({
      title: parsed.title,
      sectionId,
      plannedDate: date,
      plannedStart: parsed.plannedStart,
      plannedMinutes: parsed.plannedMinutes,
    });
    try {
      if (!fixedSection) localStorage.setItem("last-section", sectionId);
    } catch {}
    setValue("");
  }

  if (sections.length === 0) return null;

  const showHints = value.length > 0;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      style={section ? dyeVars(section.color) : undefined}
      className={cx("group flex items-center gap-2.5", compact ? "py-[3px]" : "py-2.5")}
    >
      <Plus
        className={cx("shrink-0 text-ink-3 transition-colors group-focus-within:text-ink-2", compact ? "size-3.5" : "size-4")}
        strokeWidth={1.75}
      />
      <input
        ref={ref}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setValue("");
            ref.current?.blur();
            onDone?.();
          }
        }}
        onBlur={() => !value && onDone?.()}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cx(
          "min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-3",
          compact ? "text-sm leading-5" : "text-base",
        )}
      />
      {showHints && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-3">
          {section && (
            <span className="inline-flex items-center gap-1 rounded-xs bg-[color-mix(in_oklch,var(--dye)_45%,transparent)] px-1.5 py-px text-ink-2">
              {section.name}
            </span>
          )}
          {date !== day && <span className="figures">{date ? formatDay(date, "EEE d") : "Backlog"}</span>}
          {parsed.plannedStart && <span className="figures">{parsed.plannedStart}</span>}
          {parsed.plannedMinutes && <span className="figures">{formatMinutes(parsed.plannedMinutes)}</span>}
        </span>
      )}
    </form>
  );
}
