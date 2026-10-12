"use client";

import Link from "next/link";
import { ChevronRight, FileUp, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Phone only: what the desktop spine offers but the bottom bar has no room for. */
export function PhoneExtras() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => setTheme(currentTheme()), []);

  function pick(next: Theme) {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  return (
    <section aria-label="Weergave en importeren" className="flex flex-col gap-4 lg:hidden">
      <h2 className="border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">
        Weergave
      </h2>
      <div role="radiogroup" aria-label="Pagina's" className="flex rounded-sm bg-paper-3 p-0.5">
        {(
          [
            { value: "light", label: "Licht", icon: Sun },
            { value: "dark", label: "Donker", icon: Moon },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={theme === value}
            onClick={() => pick(value)}
            className={
              "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xs text-sm transition-colors " +
              (theme === value ? "bg-paper font-medium text-ink shadow-[0_1px_2px_oklch(0.2_0.02_258/0.1)]" : "text-ink-2")
            }
          >
            <Icon className="size-4" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>
      <Link
        href="/import"
        className="flex h-11 items-center gap-2.5 rounded-sm border border-rule-strong bg-paper px-3 text-base text-ink"
      >
        <FileUp className="size-4 text-ink-3" strokeWidth={1.75} />
        Schema importeren
        <ChevronRight className="ml-auto size-4 text-ink-3" strokeWidth={1.75} />
      </Link>
    </section>
  );
}
