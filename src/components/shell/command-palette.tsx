"use client";

import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createTask } from "@/server/actions/tasks";
import { parseQuickAdd } from "@/lib/quick-add";
import { formatDay, formatMinutes } from "@/lib/time";
import { CalendarRange, ChartColumn, CornerDownLeft, FileText, FileUp, LibraryBig, Plus, Repeat, Settings } from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { dyeVars } from "@/lib/dyes";
import type { TabSection } from "./fore-edge";

export function CommandPalette({
  sections,
  docs,
  today,
}: {
  sections: TabSection[];
  docs: { id: string; title: string; slug: string }[];
  today: string;
}) {
  const [search, setSearch] = useState("");
  const [, start] = useTransition();
  const parsed = useMemo(() => parseQuickAdd(search, today, sections), [search, today, sections]);
  const quickSection = sections.find((s) => s.id === parsed.sectionId);
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPaletteOpen);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useUi.getState().paletteOpen);
        return;
      }
      // "N" adds an activity, unless you are typing somewhere.
      const el = e.target as HTMLElement | null;
      const typing = el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey && !typing) {
        const ui = useUi.getState();
        if (!ui.paletteOpen && !ui.addOpen) {
          e.preventDefault();
          ui.openAdd();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  function addTask() {
    if (!parsed.title || !quickSection) return;
    const date = parsed.plannedDate === undefined ? today : parsed.plannedDate;
    setOpen(false);
    const task = {
      title: parsed.title,
      sectionId: quickSection.id,
      plannedDate: date,
      plannedStart: parsed.plannedStart,
      plannedMinutes: parsed.plannedMinutes,
    };
    const { planner, showToast } = useUi.getState();
    if (planner?.add(task)) return;
    start(async () => {
      try {
        await createTask(task);
        showToast("Toegevoegd");
        router.refresh();
      } catch {
        showToast("Niet opgeslagen, probeer opnieuw");
      }
    });
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[oklch(0.15_0.02_163/0.35)] data-[state=open]:animate-[fade_150ms_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-50 w-[min(36rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-lg border border-rule bg-paper shadow-lift data-[state=open]:animate-[rise_180ms_var(--ease-out)]"
        >
          <Dialog.Title className="sr-only">Opdrachten</Dialog.Title>
          <Command loop className="flex flex-col">
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Ga naar een pagina, of voeg een taak toe met #sectie"
              className="h-12 border-b border-rule bg-transparent px-4 text-md outline-none"
            />
            <Command.List className="max-h-[min(24rem,60vh)] overflow-y-auto p-1.5">
              <Command.Empty className="px-3 py-6 text-center text-sm text-ink-3">
                Niets gevonden.
              </Command.Empty>
              {parsed.title && quickSection && (
                <Command.Group heading="Taak toevoegen" className={groupClass} forceMount>
                  <Item value={`__add ${search}`} onSelect={addTask} forceMount>
                    <Plus className="size-4 text-ink-3" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1 truncate text-ink">{parsed.title}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-ink-3">
                      <span style={dyeVars(quickSection.color)} className="rounded-xs bg-[var(--dye)] px-1.5 py-px text-ink">
                        {quickSection.name}
                      </span>
                      <span className="figures">
                        {parsed.plannedDate === null ? "To-do" : formatDay(parsed.plannedDate ?? today, "EEEEEE d")}
                      </span>
                      {parsed.plannedStart && <span className="figures">{parsed.plannedStart}</span>}
                      {parsed.plannedMinutes && <span className="figures">{formatMinutes(parsed.plannedMinutes)}</span>}
                    </span>
                  </Item>
                </Command.Group>
              )}
              <Command.Group heading="Ga naar" className={groupClass}>
                <Item onSelect={() => go("/week")}>
                  <CalendarRange className="size-4 text-ink-3" strokeWidth={1.75} />
                  Deze week
                </Item>
                {[
                  { href: "/sections", label: "Alle secties", icon: LibraryBig },
                  { href: "/dashboard", label: "Dashboard", icon: ChartColumn },
                  { href: "/schedules", label: "Vaste planning", icon: Repeat },
                  { href: "/import", label: "Schema importeren", icon: FileUp },
                  { href: "/settings", label: "Instellingen en agenda", icon: Settings },
                ].map(({ href, label, icon: Icon }) => (
                  <Item key={href} onSelect={() => go(href)}>
                    <Icon className="size-4 text-ink-3" strokeWidth={1.75} />
                    {label}
                  </Item>
                ))}
                {sections.map((s) => (
                  <Item key={s.id} value={`section ${s.name}`} onSelect={() => go(`/s/${s.slug}`)}>
                    <span
                      style={dyeVars(s.color)}
                      className="size-2.5 rounded-[2px] bg-[var(--dye)] ring-1 ring-[var(--dye-deep)]/30"
                    />
                    {s.name}
                  </Item>
                ))}
              </Command.Group>
              {docs.length > 0 && (
                <Command.Group heading="Documenten" className={groupClass}>
                  {docs.map((d) => (
                    <Item key={d.id} value={`doc ${d.title || "Zonder titel"} ${d.id}`} onSelect={() => go(`/s/${d.slug}/d/${d.id}`)}>
                      <FileText className="size-4 text-ink-3" strokeWidth={1.75} />
                      <span className="truncate">{d.title || "Zonder titel"}</span>
                    </Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const groupClass =
  "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-ink-3";

function Item({
  children,
  onSelect,
  value,
  forceMount,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  value?: string;
  forceMount?: boolean;
}) {
  return (
    <Command.Item
      value={value}
      forceMount={forceMount}
      onSelect={onSelect}
      className="group flex h-9 cursor-pointer items-center gap-2.5 rounded-sm px-2.5 text-base text-ink-2 data-[selected=true]:bg-ribbon-wash data-[selected=true]:text-ink"
    >
      {children}
      <CornerDownLeft className="ml-auto size-3.5 shrink-0 text-ink-3 opacity-0 group-data-[selected=true]:opacity-100" />
    </Command.Item>
  );
}
