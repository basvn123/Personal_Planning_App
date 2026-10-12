"use client";

import { Check } from "lucide-react";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";

export function TaskCheck({
  done,
  color,
  onToggle,
  label,
  size = "md",
}: {
  done: boolean;
  color: string;
  onToggle: () => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      style={dyeVars(color)}
      className={cx(
        "grid shrink-0 place-items-center rounded-[3px] border-[1.5px] transition-[background-color,border-color] duration-150",
        size === "sm" ? "size-3.5" : "size-4",
        done
          ? "border-[var(--dye-deep)] bg-[var(--dye-deep)] text-paper"
          : "border-[color-mix(in_oklch,var(--dye-deep)_70%,var(--paper))] bg-[color-mix(in_oklch,var(--dye)_25%,transparent)] hover:bg-[color-mix(in_oklch,var(--dye)_55%,transparent)]",
      )}
    >
      {done && <Check className={size === "sm" ? "size-2.5" : "size-3"} strokeWidth={3} />}
    </button>
  );
}
