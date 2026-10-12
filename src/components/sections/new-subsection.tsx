"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NewSectionForm } from "./new-section";

export function NewSectionPopover({ parentId }: { parentId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Nieuwe subsectie"
        title="Nieuwe subsectie"
        className="grid size-7 place-items-center rounded-sm text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
      >
        <Plus className="size-4" strokeWidth={1.75} />
      </PopoverTrigger>
      <PopoverContent align="end">
        <NewSectionForm parentId={parentId} onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
