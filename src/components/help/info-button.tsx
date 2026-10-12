"use client";

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HELP, type HelpTopic } from "./content";

/** A quiet (i) next to a page title that explains what the page is for and how to use it. */
export function InfoButton({ topic, align = "start" }: { topic: HelpTopic; align?: "start" | "end" }) {
  const help: { title: string; lead: string; points: React.ReactNode[]; tip?: React.ReactNode } = HELP[topic];
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Uitleg: ${help.title}`}
        title="Uitleg"
        className="grid size-7 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-paper-3 hover:text-ink data-[state=open]:bg-ribbon-wash data-[state=open]:text-ribbon-ink"
      >
        <Info className="size-4" strokeWidth={1.75} />
      </PopoverTrigger>
      <PopoverContent align={align} className="w-[min(24rem,calc(100vw-1.5rem))] p-4">
        <p className="text-base font-semibold text-ink">{help.title}</p>
        <p className="mt-1 text-sm text-ink-2">{help.lead}</p>
        <ul className="mt-3 flex flex-col gap-2">
          {help.points.map((point, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-snug text-ink">
              <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-ribbon-2" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        {help.tip && <p className="mt-3 border-t border-rule pt-2.5 text-xs text-ink-3">{help.tip}</p>}
      </PopoverContent>
    </Popover>
  );
}
