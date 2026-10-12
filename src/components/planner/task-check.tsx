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
        // The box stays small; the invisible ring around it is a thumb-sized target.
        "relative grid shrink-0 place-items-center rounded-[3px] border-[1.5px] transition-[background-color,border-color] duration-150 before:absolute before:-inset-2.5 before:content-['']",
        size === "sm" ? "size-3.5 max-lg:size-4" : "size-4 max-lg:size-5",
        done
          ? "border-[var(--dye-deep)] bg-[var(--dye-deep)] text-paper"
          : "border-[color-mix(in_oklch,var(--dye-deep)_70%,var(--paper))] bg-[color-mix(in_oklch,var(--dye)_25%,transparent)] hover:bg-[color-mix(in_oklch,var(--dye)_55%,transparent)]",
      )}
    >
      {done && <Check className={size === "sm" ? "size-2.5 max-lg:size-3" : "size-3 max-lg:size-3.5"} strokeWidth={3} />}
    </button>
  );
}
