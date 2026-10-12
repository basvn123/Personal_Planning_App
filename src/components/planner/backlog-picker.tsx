"use client";

import { useMemo, useState } from "react";
import { ListPlus, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDay } from "@/lib/time";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";
import { usePlanner } from "./planner-context";

/**
 * The "+" in front of a day's add line: pick open to-do's from any
 * section's backlog and plan them on that day.
 */
export function BacklogPicker({ day, compact }: { day: string; compact?: boolean }) {
  const { tasks, sections, patch } = usePlanner();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sectionId, setSectionId] = useState<string | null>(null);

  const backlog = useMemo(() => tasks.filter((t) => t.plannedDate === null && t.status !== "done"), [tasks]);
  const withItems = sections.filter((s) => backlog.some((t) => t.section.id === s.id));
  const q = query.trim().toLowerCase();
  const visible = backlog.filter(
    (t) => (!sectionId || t.section.id === sectionId) && (!q || t.title.toLowerCase().includes(q) || t.section.name.toLowerCase().includes(q)),
  );
  const groups = withItems
    .map((s) => ({ section: s, items: visible.filter((t) => t.section.id === s.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <PopoverTrigger
        aria-label={`To-do inplannen op ${formatDay(day, "EEEE d MMMM")}`}
        title="Uit je to-do's kiezen"
        className={cx(
          "grid shrink-0 place-items-center rounded-xs text-ink-3 transition-colors hover:bg-paper-3 hover:text-ink",
          compact ? "-ml-1 size-6" : "-ml-1.5 size-7",
        )}
      >
        <ListPlus className={compact ? "size-3.5" : "size-4"} strokeWidth={1.75} />
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2 p-2">
        <div className="flex items-center justify-between px-1 pt-0.5">
          <span className="text-sm font-medium text-ink">Inplannen op {formatDay(day, "EEEE d MMM")}</span>
          <span className="figures text-xs text-ink-3">{backlog.length} open</span>
        </div>
        <label className="flex h-8 items-center gap-2 rounded-sm border border-rule-strong bg-paper px-2 focus-within:border-cloth-3">
          <Search className="size-3.5 text-ink-3" strokeWidth={1.75} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek een to-do"
            aria-label="Zoek een to-do"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3"
          />
        </label>
        {withItems.length > 1 && (
          <div className="flex flex-wrap gap-1" role="group" aria-label="Sectie">
            <Chip active={!sectionId} onClick={() => setSectionId(null)}>
              Alles
            </Chip>
            {withItems.map((s) => (
              <Chip key={s.id} active={sectionId === s.id} onClick={() => setSectionId(sectionId === s.id ? null : s.id)} color={s.color}>
                {s.name}
              </Chip>
            ))}
          </div>
        )}
        <div className="max-h-72 overflow-y-auto">
          {groups.length === 0 ? (
            <p className="px-1 py-4 text-sm text-ink-3">
              {backlog.length === 0 ? "Geen open to-do's. Zet ze in een sectie onder To-do." : "Niets gevonden."}
            </p>
          ) : (
            groups.map(({ section, items }) => (
              <div key={section.id} style={dyeVars(section.color)} className="pb-1.5">
                <p className="flex items-center gap-1.5 px-1 pb-0.5 pt-1.5 text-2xs font-medium uppercase tracking-[0.06em] text-ink-3">
                  <span className="size-2 rounded-[2px] bg-[var(--dye)]" />
                  {section.name}
                </p>
                <ul>
                  {items.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => patch(t.id, { plannedDate: day })}
                        className="flex min-h-8 w-full items-center gap-2 rounded-xs px-2 py-1 text-left text-sm text-ink hover:bg-ribbon-wash"
                      >
                        <span className="min-w-0 flex-1">{t.title}</span>
                        {t.plannedMinutes && <span className="figures shrink-0 text-xs text-ink-3">{t.plannedMinutes}m</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Chip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={color ? dyeVars(color) : undefined}
      className={cx(
        "inline-flex h-6 items-center gap-1 rounded-xs px-2 text-xs transition-colors",
        active ? "bg-ink text-paper" : "bg-paper-3 text-ink-2 hover:text-ink",
      )}
    >
      {color && <span className="size-1.5 rounded-full bg-[var(--dye-deep)]" />}
      {children}
    </button>
  );
}
