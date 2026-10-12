"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarRange, ChartColumn, Command, FileUp, LibraryBig, Plus, Repeat, Search, Settings } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { TimerChip } from "@/components/timer/timer-chip";
import { useUi } from "@/lib/ui-store";
import { cx } from "@/lib/cx";

const NAV = [
  { href: "/week", label: "Week", icon: CalendarRange },
  { href: "/sections", label: "Secties", icon: LibraryBig },
  { href: "/dashboard", label: "Dashboard", icon: ChartColumn },
  { href: "/schedules", label: "Vaste planning", icon: Repeat },
  { href: "/import", label: "Importeren", icon: FileUp },
] as const;

const SETTINGS = { href: "/settings", label: "Instellingen", icon: Settings };

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: typeof CalendarRange }) {
  const pathname = usePathname();
  const active =
    pathname === href || pathname.startsWith(href + "/") || (href === "/sections" && pathname.startsWith("/s/"));
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cx(
        "group relative grid size-10 place-items-center rounded-md text-cloth-ink-2 transition-colors duration-150 hover:bg-cloth-3/60 hover:text-cloth-ink",
        active && "bg-cloth-3 text-cloth-ink",
      )}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} />
      <span className="pointer-events-none absolute left-12 z-30 hidden whitespace-nowrap rounded-sm bg-ink px-2 py-1 text-xs text-paper opacity-0 transition-opacity duration-150 group-hover:opacity-100 lg:block">
        {label}
      </span>
    </Link>
  );
}

/** Desktop: the cloth spine on the left. */
export function Spine() {
  const openPalette = useUi((s) => s.openPalette);
  return (
    <nav
      aria-label="Navigatie"
      className="hidden h-dvh w-14 shrink-0 flex-col items-center gap-1 py-3 lg:flex"
    >
      <Link href="/week" aria-label="Start" className="mb-3 grid size-10 place-items-center">
        <Mark />
      </Link>
      {NAV.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
      <button
        type="button"
        onClick={openPalette}
        aria-label="Zoeken en opdrachten"
        className="grid size-10 place-items-center rounded-md text-cloth-ink-2 transition-colors duration-150 hover:bg-cloth-3/60 hover:text-cloth-ink"
      >
        <Command className="size-[18px]" strokeWidth={1.75} />
      </button>
      <div className="mt-auto flex flex-col items-center gap-3">
        <TimerChip orientation="vertical" />
        <ThemeToggle />
        <NavItem {...SETTINGS} />
      </div>
    </nav>
  );
}

/**
 * Phone: the same cloth, as a bar along the bottom edge. It runs under the
 * home indicator in one color, with the icons sitting low, close to the edge.
 */
export function SpineBar() {
  const openPalette = useUi((s) => s.openPalette);
  const setAddOpen = useUi((s) => s.setAddOpen);
  const [week, sections, dashboard, schedules] = NAV;
  return (
    <nav
      aria-label="Navigatie"
      className="flex shrink-0 items-center justify-around gap-1 bg-cloth px-2 pt-1 pb-[max(0.375rem,calc(env(safe-area-inset-bottom)-1.5rem))] lg:hidden"
    >
      <BarItem {...week} />
      <BarItem {...sections} />
      <BarItem {...dashboard} />
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        aria-label="Activiteit toevoegen"
        className="grid size-12 shrink-0 place-items-center rounded-full bg-cloth-ink text-cloth shadow-[0_2px_8px_oklch(0.1_0.03_163/0.45)] transition-transform active:scale-95"
      >
        <Plus className="size-6" strokeWidth={2.25} />
      </button>
      <BarItem {...schedules} />
      <TimerChip orientation="horizontal" />
      <button
        type="button"
        onClick={openPalette}
        aria-label="Zoeken en opdrachten"
        className="flex h-12 min-w-0 max-w-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-cloth-ink-2 active:bg-cloth-3/60"
      >
        <Search className="size-[22px]" strokeWidth={1.75} />
        <span className="text-[0.625rem] leading-none">Zoek</span>
      </button>
      <BarItem {...SETTINGS} short="Meer" />
    </nav>
  );
}

const SHORT: Record<string, string> = { "/dashboard": "Stats", "/schedules": "Vast" };

function BarItem({ href, label, icon: Icon, short }: { href: string; label: string; icon: typeof CalendarRange; short?: string }) {
  const pathname = usePathname();
  const active =
    pathname === href || pathname.startsWith(href + "/") || (href === "/sections" && pathname.startsWith("/s/"));
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex h-12 min-w-0 max-w-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-0.5 transition-colors",
        active ? "bg-cloth-3 text-cloth-ink" : "text-cloth-ink-2 active:bg-cloth-3/60",
      )}
    >
      <Icon className="size-[22px]" strokeWidth={active ? 2 : 1.75} />
      <span className="max-w-full truncate text-[0.625rem] leading-none">{short ?? SHORT[href] ?? label}</span>
    </Link>
  );
}

export function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
      <rect x="4" y="6" width="24" height="20" rx="2.5" fill="var(--cloth-ink)" opacity="0.92" />
      <rect x="15.3" y="6" width="1.4" height="20" fill="var(--cloth)" />
      <path d="M20.5 6h3.5v8l-1.75-1.4L20.5 14z" fill="var(--ribbon)" />
    </svg>
  );
}
