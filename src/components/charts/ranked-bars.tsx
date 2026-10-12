"use client";

import Link from "next/link";
import { formatDuration } from "@/lib/time";
import { dyeVars } from "@/lib/dyes";
import { TipArea, useTip } from "./tip";

export type RankedDatum = { id: string; label: string; sub?: string; href?: string; color: string; seconds: number };

/** One labeled bar per item, sorted. Name and value are always printed, so color is never the only cue. */
export function RankedBars({ data, total }: { data: RankedDatum[]; total: number }) {
  const max = Math.max(1, ...data.map((d) => d.seconds));
  return (
    <TipArea>
      <ul className="flex flex-col">
        {data.map((d) => (
          <Row key={d.id} d={d} max={max} total={total} />
        ))}
      </ul>
    </TipArea>
  );
}

function Row({ d, max, total }: { d: RankedDatum; max: number; total: number }) {
  const share = total > 0 ? Math.round((d.seconds / total) * 100) : 0;
  const tip = useTip(
    <span className="figures">
      {d.label}: {formatDuration(d.seconds)} ({share}%)
    </span>,
  );
  const name = d.href ? (
    <Link href={d.href} className="truncate hover:underline">
      {d.label}
    </Link>
  ) : (
    <span className="truncate">{d.label}</span>
  );
  return (
    <li style={dyeVars(d.color)} className="grid grid-cols-[minmax(0,9rem)_1fr_3.25rem_2.5rem] items-center gap-3 py-1.5 text-sm">
      <span className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-2 text-ink">
          <span className="size-2 shrink-0 rounded-[2px] bg-[var(--dye)] ring-1 ring-[color-mix(in_oklch,var(--dye-deep)_40%,transparent)]" />
          {name}
        </span>
        {d.sub && <span className="truncate pl-4 text-2xs text-ink-3">{d.sub}</span>}
      </span>
      <span {...tip} className="h-3 outline-none" aria-label={`${d.label} ${formatDuration(d.seconds)}`}>
        <span
          className="block h-full rounded-r-[4px] bg-[var(--dye-deep)] transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(1.5, (d.seconds / max) * 100)}%` }}
        />
      </span>
      <span className="figures text-right text-ink">{formatDuration(d.seconds)}</span>
      <span className="figures text-right text-xs text-ink-3">{share}%</span>
    </li>
  );
}
