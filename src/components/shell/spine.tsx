"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarRange, Command } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { TimerChip } from "@/components/timer/timer-chip";
import { useUi } from "@/lib/ui-store";
import { cx } from "@/lib/cx";

const NAV = [{ href: "/week", label: "Week", icon: CalendarRange }] as const;

function NavItem({ href, label, icon: Icon }: (typeof NAV)[number]) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
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
      aria-label="Main"
      className="hidden h-dvh w-14 shrink-0 flex-col items-center gap-1 py-3 lg:flex"
    >
      <Link href="/week" aria-label="Home" className="mb-3 grid size-10 place-items-center">
        <Mark />
      </Link>
      {NAV.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
      <button
        type="button"
        onClick={openPalette}
        aria-label="Search and commands"
        className="grid size-10 place-items-center rounded-md text-cloth-ink-2 transition-colors duration-150 hover:bg-cloth-3/60 hover:text-cloth-ink"
      >
        <Command className="size-[18px]" strokeWidth={1.75} />
      </button>
      <div className="mt-auto flex flex-col items-center gap-3">
        <TimerChip orientation="vertical" />
        <ThemeToggle />
      </div>
    </nav>
  );
}

/** Phone: the same cloth, as a bar along the bottom edge. */
export function SpineBar() {
  const openPalette = useUi((s) => s.openPalette);
  return (
    <nav
      aria-label="Main"
      className="flex h-14 shrink-0 items-center justify-around border-t border-cloth-3/50 bg-cloth px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
      style={{ boxSizing: "content-box" }}
    >
      {NAV.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
      <button
        type="button"
        onClick={openPalette}
        aria-label="Search and commands"
        className="grid size-10 place-items-center rounded-md text-cloth-ink-2 hover:text-cloth-ink"
      >
        <Command className="size-[18px]" strokeWidth={1.75} />
      </button>
      <TimerChip orientation="horizontal" />
      <ThemeToggle />
    </nav>
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
