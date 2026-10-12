"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NewSectionForm } from "./new-section";
import { cardActionClass } from "@/components/ui/card";

/** "+ Nieuwe sectie": a labelled cloth button, or (compact) the round plus of a card header. */
export function NewSectionInline({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      {compact ? (
        <PopoverTrigger aria-label="Nieuwe sectie" title="Nieuwe sectie" className={cardActionClass}>
          <Plus className="size-5 lg:size-4" strokeWidth={2.25} />
        </PopoverTrigger>
      ) : (
        <PopoverTrigger className="inline-flex h-10 items-center gap-1.5 rounded-full bg-cloth px-4 text-sm font-medium text-cloth-ink transition-colors hover:bg-cloth-3 lg:h-8">
          <Plus className="size-4" strokeWidth={2} />
          Nieuwe sectie
        </PopoverTrigger>
      )}
      <PopoverContent align="end">
        <NewSectionForm onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
