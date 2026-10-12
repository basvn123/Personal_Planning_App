"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, IconButton } from "@/components/ui/button";
import { deleteFile, renameFile } from "@/server/actions/files";

export function FileTitle({ id, name }: { id: string; name: string }) {
  const [value, setValue] = useState(name);
  const [, start] = useTransition();
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => value.trim() && value !== name && start(() => renameFile(id, value))}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      aria-label="Bestandsnaam"
      className="w-full bg-transparent text-xl font-semibold tracking-[-0.02em] text-ink outline-none"
    />
  );
}

export function FileActions({ id, slug }: { id: string; slug: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <span className="flex items-center gap-1">
      <a
        href={`/api/files/${id}?download=1`}
        className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-rule-strong bg-paper px-3 text-sm font-medium text-ink transition-colors hover:bg-paper-3"
      >
        <Download className="size-3.5" strokeWidth={1.75} />
        Downloaden
      </a>
      <Popover>
        <PopoverTrigger asChild>
          <IconButton label="Bestand verwijderen">
            <Trash2 className="size-4" strokeWidth={1.75} />
          </IconButton>
        </PopoverTrigger>
        <PopoverContent align="end" className="flex w-56 flex-col gap-2">
          <p className="text-sm">Dit bestand verwijderen?</p>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await deleteFile(id);
                router.push(`/s/${slug}`);
              })
            }
          >
            Verwijderen
          </Button>
        </PopoverContent>
      </Popover>
    </span>
  );
}
