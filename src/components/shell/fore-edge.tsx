"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { moveSection } from "@/server/actions/sections";
import { NewSectionTab } from "@/components/sections/new-section";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";

export type TabSection = { id: string; name: string; slug: string; color: string };

function useOrderedTabs(sections: TabSection[]) {
  const [items, setItems] = useState(sections);
  useEffect(() => setItems(sections), [sections]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((s) => s.id === active.id);
    const to = items.findIndex((s) => s.id === over.id);
    const next = arrayMove(items, from, to);
    setItems(next);
    moveSection(String(active.id), next[to - 1]?.id ?? null, next[to + 1]?.id ?? null).catch(() =>
      setItems(items),
    );
  }

  return { items, sensors, onDragEnd };
}

function useActiveSlug() {
  const pathname = usePathname();
  const match = pathname.match(/^\/s\/([^/]+)/);
  return match?.[1] ?? null;
}

/** Desktop: index tabs cut into the fore-edge, one per top-level section. */
export function ForeEdge({ sections, activeRoot }: { sections: TabSection[]; activeRoot?: Record<string, string> }) {
  const { items, sensors, onDragEnd } = useOrderedTabs(sections);
  const activeSlug = useActiveSlug();
  const activeTab = activeSlug ? (activeRoot?.[activeSlug] ?? activeSlug) : null;
  return (
    <nav
      aria-label="Sections"
      className="hidden h-dvh w-10 shrink-0 flex-col gap-1 overflow-y-auto py-6 [scrollbar-width:none] lg:flex"
    >
      <DndContext id="fore-edge" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((s) => (
            <Tab key={s.id} section={s} active={activeTab === s.slug} orientation="vertical" />
          ))}
        </SortableContext>
      </DndContext>
      <NewSectionTab orientation="vertical" />
    </nav>
  );
}

/** Phone: the same tabs as a strip along the top of the page. */
export function TabStrip({ sections, activeRoot }: { sections: TabSection[]; activeRoot?: Record<string, string> }) {
  const { items, sensors, onDragEnd } = useOrderedTabs(sections);
  const activeSlug = useActiveSlug();
  const activeTab = activeSlug ? (activeRoot?.[activeSlug] ?? activeSlug) : null;
  return (
    <nav
      aria-label="Sections"
      className="flex shrink-0 items-end gap-1 overflow-x-auto bg-cloth px-3 pt-[max(0.5rem,env(safe-area-inset-top))] [scrollbar-width:none] lg:hidden"
    >
      <DndContext id="tab-strip" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items} strategy={horizontalListSortingStrategy}>
          {items.map((s) => (
            <Tab key={s.id} section={s} active={activeTab === s.slug} orientation="horizontal" />
          ))}
        </SortableContext>
      </DndContext>
      <NewSectionTab orientation="horizontal" />
    </nav>
  );
}

function Tab({
  section: s,
  active,
  orientation,
}: {
  section: TabSection;
  active: boolean;
  orientation: "vertical" | "horizontal";
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, node } = useSortable({ id: s.id });
  useEffect(() => {
    if (active && orientation === "horizontal") node.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [active, orientation, node]);
  const style = {
    ...dyeVars(s.color),
    transform: CSS.Translate.toString(transform),
    transition,
  };
  return (
    <Link
      ref={setNodeRef}
      href={`/s/${s.slug}`}
      aria-current={active ? "page" : undefined}
      style={style}
      {...attributes}
      role={undefined}
      {...listeners}
      className={cx(
        "relative shrink-0 select-none font-medium text-ink transition-[background-color,translate] duration-200 ease-out",
        orientation === "vertical"
          ? "-ml-1 flex min-h-16 items-center justify-center rounded-r-sm py-3.5 pl-1 text-xs tracking-[0.01em] [writing-mode:vertical-rl]"
          : "rounded-t-sm px-3 py-1.5 text-xs",
        active
          ? "bg-[var(--dye)] font-semibold"
          : orientation === "vertical"
            ? "-translate-x-0.5 bg-[color-mix(in_oklch,var(--dye)_86%,var(--cloth))] hover:translate-x-0"
            : "translate-y-0.5 bg-[color-mix(in_oklch,var(--dye)_86%,var(--cloth))]",
        isDragging && "z-10 shadow-lift",
      )}
    >
      <span className={orientation === "vertical" ? "max-h-40 truncate" : "whitespace-nowrap"}>{s.name}</span>
    </Link>
  );
}
