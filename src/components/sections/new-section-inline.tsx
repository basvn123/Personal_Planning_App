"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NewSectionForm } from "./new-section";

export function NewSectionInline() {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-cloth px-3 text-sm font-medium text-cloth-ink transition-colors hover:bg-cloth-3">
        <Plus className="size-4" strokeWidth={2} />
        Nieuwe sectie
      </PopoverTrigger>
      <PopoverContent align="start">
        <NewSectionForm onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
