"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, inputClass } from "@/components/ui/button";
import { createSection } from "@/server/actions/sections";
import { DYES } from "@/lib/dyes";
import { DyePicker } from "./dye-picker";

export function NewSectionForm({
  parentId,
  onDone,
}: {
  parentId?: string | null;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(() => DYES[Math.floor(Math.random() * DYES.length)]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    start(async () => {
      try {
        const { slug } = await createSection({ name, color, parentId });
        setName("");
        onDone?.();
        router.push(`/s/${slug}`);
      } catch {
        setError("Could not create the section.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex w-64 flex-col gap-3">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={parentId ? "Subsection name" : "Section name"}
        aria-label="Name"
        maxLength={80}
        className={inputClass}
      />
      <DyePicker value={color} onChange={setColor} />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" variant="primary" disabled={pending || !name.trim()}>
        Add
      </Button>
    </form>
  );
}

export function NewSectionTab({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="New section"
        className={
          orientation === "vertical"
            ? "-ml-1 grid h-10 shrink-0 place-items-center rounded-r-sm pl-1 text-cloth-ink-2 transition-colors hover:bg-cloth-3/60 hover:text-cloth-ink"
            : "grid h-8 shrink-0 place-items-center rounded-t-sm px-3 text-cloth-ink-2 hover:text-cloth-ink"
        }
      >
        <Plus className="size-4" strokeWidth={1.75} />
      </PopoverTrigger>
      <PopoverContent side={orientation === "vertical" ? "left" : "bottom"} align="start">
        <NewSectionForm onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
