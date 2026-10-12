"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarRange,
  ChevronRight,
  Command,
  Ellipsis,
  FileUp,
  LibraryBig,
  LogOut,
  Moon,
  Plus,
  Repeat,
  Search,
  Settings,
  Sun,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { TimerChip } from "@/components/timer/timer-chip";
import { Sheet } from "@/components/ui/sheet";
import { Segmented } from "@/components/ui/segmented";
import { CardIcon } from "@/components/ui/card";
import { signOut } from "@/server/actions/settings";
import { useUi } from "@/lib/ui-store";
import { cx } from "@/lib/cx";

/** The app's places. Desktop shows them all on the spine; the phone bar shows the first three plus Meer. */
const PLANNER = { href: "/week", label: "Planner", icon: CalendarRange };
const SECTIONS = { href: "/sections", label: "Secties", icon: LibraryBig };
const PROGRESS = { href: "/dashboard", label: "Voortgang", icon: Trophy };
const SCHEDULES = { href: "/schedules", label: "Vaste planning", icon: Repeat };
const IMPORT = { href: "/import", label: "Importeren", icon: FileUp };
const SETTINGS = { href: "/settings", label: "Instellingen", icon: Settings };

type Place = { href: string; label: string; icon: LucideIcon };

function useActive(href: string) {
  const pathname = usePathname();
  return pathname === href || pathname.startsWith(href + "/") || (href === "/sections" && pathname.startsWith("/s/"));
}

function NavItem({ href, label, icon: Icon }: Place) {
  const active = useActive(href);
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
  const openAdd = useUi((s) => s.openAdd);
  return (
    <nav aria-label="Navigatie" className="hidden h-dvh w-14 shrink-0 flex-col items-center gap-1 py-3 lg:flex">
      <Link href="/week" aria-label="Start" className="mb-3 grid size-10 place-items-center">
        <Mark />
      </Link>
      {[PLANNER, SECTIONS, PROGRESS, SCHEDULES, IMPORT].map((item) => (
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
      <button
        type="button"
        onClick={() => openAdd()}
        aria-label="Activiteit toevoegen"
        title="Activiteit toevoegen (N)"
        className="mt-2 grid size-10 place-items-center rounded-full bg-cloth-ink text-cloth transition-transform hover:scale-105"
      >
        <Plus className="size-5" strokeWidth={2.25} />
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
 * Phone: five places along the bottom edge, the add button in the middle.
 * While a timer runs, its strip sits on top of the bar (pushing the page up,
 * never covering it).
 */
export function SpineBar() {
  const openAdd = useUi((s) => s.openAdd);
  const [more, setMore] = useState(false);
  const pathname = usePathname();
  const moreActive = [SCHEDULES.href, IMPORT.href, SETTINGS.href].some((h) => pathname.startsWith(h));
  return (
    <div className="shrink-0 lg:hidden">
      <TimerChip orientation="horizontal" />
      <nav
        aria-label="Navigatie"
        className="grid grid-cols-5 items-center bg-cloth px-1 pt-1 pb-[max(0.375rem,calc(env(safe-area-inset-bottom)-1.5rem))]"
      >
        <BarItem {...PLANNER} />
        <BarItem {...SECTIONS} />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => openAdd()}
            aria-label="Activiteit toevoegen"
            className="grid size-[3.25rem] place-items-center rounded-full bg-cloth-ink text-cloth shadow-[0_2px_8px_oklch(0.1_0.03_163/0.45)] transition-transform active:scale-95"
          >
            <Plus className="size-6" strokeWidth={2.25} />
          </button>
        </div>
        <BarItem {...PROGRESS} />
        <button
          type="button"
          onClick={() => setMore(true)}
          aria-label="Meer"
          aria-expanded={more}
          className={cx(
            "mx-auto flex h-12 w-full max-w-20 flex-col items-center justify-center gap-0.5 rounded-lg transition-colors",
            moreActive ? "bg-cloth-3 text-cloth-ink" : "text-cloth-ink-2 active:bg-cloth-3/60",
          )}
        >
          <Ellipsis className="size-[22px]" strokeWidth={moreActive ? 2 : 1.75} />
          <span className="text-[0.6875rem] leading-none">Meer</span>
        </button>
      </nav>
      <MoreSheet open={more} onOpenChange={setMore} />
    </div>
  );
}

function BarItem({ href, label, icon: Icon }: Place) {
  const active = useActive(href);
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cx(
        "mx-auto flex h-12 w-full max-w-20 flex-col items-center justify-center gap-0.5 rounded-lg transition-colors",
        active ? "bg-cloth-3 text-cloth-ink" : "text-cloth-ink-2 active:bg-cloth-3/60",
      )}
    >
      <Icon className="size-[22px]" strokeWidth={active ? 2 : 1.75} />
      <span className="max-w-full truncate text-[0.6875rem] leading-none">{label}</span>
    </Link>
  );
}

type Theme = "light" | "dark";

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Phone: everything the bar has no room for, as big rows. */
function MoreSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const openPalette = useUi((s) => s.openPalette);
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    if (open) setTheme(currentTheme());
  }, [open]);

  function pickTheme(next: Theme) {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  const rows: { label: string; sub: string; icon: LucideIcon; onClick: () => void }[] = [
    {
      label: "Zoeken",
      sub: "Pagina's, secties, documenten, snel een taak",
      icon: Search,
      onClick: () => {
        onOpenChange(false);
        openPalette();
      },
    },
    { label: SCHEDULES.label, sub: "Lessen, trainingen en andere vaste afspraken", icon: Repeat, onClick: () => go(SCHEDULES.href) },
    { label: "Schema importeren", sub: "Een CSV- of JSON-schema in je planning zetten", icon: FileUp, onClick: () => go(IMPORT.href) },
    { label: SETTINGS.label, sub: "Account, tijdzone, agenda op je telefoon", icon: Settings, onClick: () => go(SETTINGS.href) },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Meer">
      <div className="flex flex-col gap-4 pb-2">
        <ul className="divide-y divide-rule rounded-xl border border-rule">
          {rows.map(({ label, sub, icon, onClick }) => (
            <li key={label}>
              <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left active:bg-paper-3">
                <CardIcon icon={icon} />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium text-ink">{label}</span>
                  <span className="block truncate text-xs text-ink-3">{sub}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-ink-3" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1.5">
          <span className="px-1 text-xs font-medium text-ink-3">Weergave</span>
          <Segmented
            label="Weergave"
            value={theme}
            onChange={pickTheme}
            options={[
              { value: "light", label: "Licht", icon: Sun },
              { value: "dark", label: "Donker", icon: Moon },
            ]}
          />
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-danger active:bg-danger-wash"
          >
            <LogOut className="size-4" strokeWidth={1.75} />
            Afmelden
          </button>
        </form>
      </div>
    </Sheet>
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
