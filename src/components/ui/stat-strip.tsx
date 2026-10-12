import { cx } from "@/lib/cx";

/** Three (or so) headline figures side by side, split by hairlines. */
export function StatStrip({
  items,
  className,
}: {
  items: { label: string; value: React.ReactNode; hint?: string }[];
  className?: string;
}) {
  return (
    <dl className={cx("grid divide-x divide-rule", className)} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it) => (
        <div key={it.label} className="flex min-w-0 flex-col gap-1 px-3 py-1 first:pl-0 last:pr-0" title={it.hint}>
          <dt className="truncate text-xs text-ink-3">{it.label}</dt>
          <dd className="figures flex items-baseline text-lg font-semibold leading-none text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
