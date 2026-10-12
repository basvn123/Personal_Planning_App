"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";

export type TabSection = { id: string; name: string; slug: string; color: string };

/** Desktop: index tabs cut into the fore-edge, one per section. */
export function ForeEdge({ sections }: { sections: TabSection[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Sections"
      className="hidden h-dvh w-10 shrink-0 flex-col gap-1 overflow-y-auto py-6 [scrollbar-width:none] lg:flex"
    >
      {sections.map((s) => {
        const active = pathname === `/s/${s.slug}` || pathname.startsWith(`/s/${s.slug}/`);
        return (
          <Link
            key={s.id}
            href={`/s/${s.slug}`}
            aria-current={active ? "page" : undefined}
            style={dyeVars(s.color)}
            className={cx(
              "relative -ml-1 flex min-h-16 shrink-0 items-center justify-center rounded-r-sm py-3.5 pl-1 text-xs font-medium tracking-[0.01em] text-ink transition-[transform,background-color] duration-200 ease-out [writing-mode:vertical-rl]",
              "bg-[color-mix(in_oklch,var(--dye)_88%,var(--paper))] hover:translate-x-0.5",
              active && "translate-x-0.5 bg-[var(--dye)] font-semibold",
            )}
          >
            <span className="max-h-40 truncate">{s.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Phone: the same tabs as a strip along the top of the page. */
export function TabStrip({ sections }: { sections: TabSection[] }) {
  const pathname = usePathname();
  if (sections.length === 0) return null;
  return (
    <nav
      aria-label="Sections"
      className="flex shrink-0 gap-1 overflow-x-auto bg-cloth px-3 pt-2 [scrollbar-width:none] lg:hidden"
    >
      {sections.map((s) => {
        const active = pathname === `/s/${s.slug}` || pathname.startsWith(`/s/${s.slug}/`);
        return (
          <Link
            key={s.id}
            href={`/s/${s.slug}`}
            aria-current={active ? "page" : undefined}
            style={dyeVars(s.color)}
            className={cx(
              "shrink-0 rounded-t-sm px-3 pb-1.5 pt-1.5 text-xs font-medium text-ink transition-transform duration-200",
              "bg-[color-mix(in_oklch,var(--dye)_85%,var(--cloth))] translate-y-0.5",
              active && "translate-y-0 bg-[var(--dye)] font-semibold",
            )}
          >
            {s.name}
          </Link>
        );
      })}
    </nav>
  );
}
