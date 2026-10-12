"use client";

import { Check } from "lucide-react";
import { DYES, dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";

export function DyePicker({ value, onChange }: { value: string; onChange: (dye: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Color" className="grid grid-cols-6 gap-1.5">
      {DYES.map((dye) => (
        <button
          key={dye}
          type="button"
          role="radio"
          aria-checked={value === dye}
          aria-label={dye}
          title={dye}
          onClick={() => onChange(dye)}
          style={dyeVars(dye)}
          className={cx(
            "grid h-7 place-items-center rounded-xs bg-[var(--dye)] text-[var(--dye-deep)] ring-offset-2 ring-offset-paper transition-shadow",
            value === dye ? "ring-2 ring-ink" : "hover:ring-1 hover:ring-rule-strong",
          )}
        >
          {value === dye && <Check className="size-3.5 text-ink" strokeWidth={2.5} />}
        </button>
      ))}
    </div>
  );
}
