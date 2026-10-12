"use client";

import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";

/** A two-to-four-way switch: a recessed track with the chosen part raised. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className,
  size = "md",
}: {
  options: { value: T; label: React.ReactNode; icon?: LucideIcon; title?: string }[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("flex rounded-lg bg-paper-3 p-0.5", className)}>
      {options.map(({ value: v, label: text, icon: Icon, title }) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={value === v}
          title={title}
          onClick={() => onChange(v)}
          className={cx(
            "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-sm transition-colors",
            size === "md" ? "h-10 lg:h-8" : "h-8 lg:h-7",
            value === v ? "bg-card font-medium text-ink shadow-[0_1px_2px_oklch(0.2_0.02_258/0.12)]" : "text-ink-2 hover:text-ink",
          )}
        >
          {Icon && <Icon className="size-4 shrink-0" strokeWidth={1.75} />}
          {text !== "" && <span className="truncate">{text}</span>}
        </button>
      ))}
    </div>
  );
}
