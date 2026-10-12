"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { undoImport } from "@/server/actions/imports";

export function ImportHistory({
  items,
}: {
  items: { id: string; filename: string; taskCount: number; remaining: number; createdAt: Date }[];
}) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const [pending, run] = useTransition();
  if (items.length === 0) return <p className="py-4 text-sm text-ink-3">No imports yet.</p>;
  return (
    <ul>
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-3 border-b border-rule py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{it.filename}</p>
            <p className="figures text-xs text-ink-3">
              {format(it.createdAt, "d MMM yyyy, HH:mm")} · {it.remaining} of {it.taskCount} tasks left
            </p>
          </div>
          {confirm === it.id ? (
            <Button variant="danger" disabled={pending} onClick={() => run(async () => { await undoImport(it.id); setConfirm(null); })}>
              Remove {it.remaining} tasks
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setConfirm(it.id)} disabled={it.remaining === 0}>
              <Undo2 className="size-3.5" strokeWidth={1.75} />
              Undo
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
