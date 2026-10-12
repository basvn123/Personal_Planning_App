"use client";

import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CalendarRange, CornerDownLeft, FileText } from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { dyeVars } from "@/lib/dyes";
import type { TabSection } from "./fore-edge";

export function CommandPalette({
  sections,
  docs,
}: {
  sections: TabSection[];
  docs: { id: string; title: string; slug: string }[];
}) {
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPaletteOpen);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useUi.getState().paletteOpen);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

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
          <Dialog.Title className="sr-only">Commands</Dialog.Title>
          <Command loop className="flex flex-col">
            <Command.Input
              autoFocus
              placeholder="Jump to a section or document"
              className="h-12 border-b border-rule bg-transparent px-4 text-md outline-none"
            />
            <Command.List className="max-h-[min(24rem,60vh)] overflow-y-auto p-1.5">
              <Command.Empty className="px-3 py-6 text-center text-sm text-ink-3">
                No match.
              </Command.Empty>
              <Command.Group heading="Go to" className={groupClass}>
                <Item onSelect={() => go("/week")}>
                  <CalendarRange className="size-4 text-ink-3" strokeWidth={1.75} />
                  This week
                </Item>
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
                <Command.Group heading="Documents" className={groupClass}>
                  {docs.map((d) => (
                    <Item key={d.id} value={`doc ${d.title || "Untitled"} ${d.id}`} onSelect={() => go(`/s/${d.slug}/d/${d.id}`)}>
                      <FileText className="size-4 text-ink-3" strokeWidth={1.75} />
                      <span className="truncate">{d.title || "Untitled"}</span>
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
}: {
  children: React.ReactNode;
  onSelect: () => void;
  value?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group flex h-9 cursor-pointer items-center gap-2.5 rounded-sm px-2.5 text-base text-ink-2 data-[selected=true]:bg-ribbon-wash data-[selected=true]:text-ink"
    >
      {children}
      <CornerDownLeft className="ml-auto size-3.5 text-ink-3 opacity-0 group-data-[selected=true]:opacity-100" />
    </Command.Item>
  );
}
