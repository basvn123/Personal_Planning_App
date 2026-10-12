"use client";

import { cardActionClass } from "@/components/ui/card";
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
        className={cardActionClass}
      >
        <Plus className="size-5 lg:size-4" strokeWidth={2.25} />
      </PopoverTrigger>
      <PopoverContent align="end">
        <NewSectionForm parentId={parentId} onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
