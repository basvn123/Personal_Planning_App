import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cx } from "@/lib/cx";

/**
 * A tappable line inside a card: something in front (an icon or a color),
 * a title, small meta on the right and a chevron. Use inside a
 * `divide-y divide-rule` list.
 */
export function ListRow({
  href,
  lead,
  title,
  sub,
  meta,
  style,
  indent = 0,
  chevron = true,
}: {
  href: string;
  lead?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  meta?: React.ReactNode;
  style?: React.CSSProperties;
  indent?: number;
  chevron?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        style={style}
        className="-mx-2 flex min-h-12 items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-paper-3/70 active:bg-paper-3"
      >
        {indent > 0 && <span aria-hidden style={{ width: indent * 14 }} className="shrink-0" />}
        {lead}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base text-ink">{title}</span>
          {sub && <span className="mt-0.5 block truncate text-xs text-ink-3">{sub}</span>}
        </span>
        {meta && <span className="flex shrink-0 items-center gap-2 text-xs text-ink-3">{meta}</span>}
        {chevron && <ChevronRight aria-hidden className={cx("size-4 shrink-0 text-ink-3")} strokeWidth={1.75} />}
      </Link>
    </li>
  );
}
