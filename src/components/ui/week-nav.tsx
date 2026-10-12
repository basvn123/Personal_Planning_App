import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const arrow =
  "grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink active:bg-paper-3 lg:size-8";

/** Previous / calendar / back to now / next, the same on every page that pages through weeks. */
export function WeekNav({
  prev,
  next,
  now,
  nowLabel = "Vandaag",
  jump,
}: {
  prev: string;
  next: string;
  /** Link back to the current week; omit when already there. */
  now?: string;
  nowLabel?: string;
  /** The calendar button that jumps to any week (a client component). */
  jump?: React.ReactNode;
}) {
  return (
    <nav aria-label="Weken" className="flex shrink-0 items-center">
      <Link href={prev} aria-label="Vorige week" className={arrow}>
        <ChevronLeft className="size-5 lg:size-4" strokeWidth={1.75} />
      </Link>
      {jump}
      {now && (
        <Link
          href={now}
          className="inline-flex h-9 items-center whitespace-nowrap rounded-full px-2 text-sm font-medium text-[var(--link)] transition-colors hover:bg-paper-3 lg:h-8 lg:px-3"
        >
          {/* A phone has no room for the full label next to the title, so it reads "Nu" there. */}
          <span aria-hidden className="lg:hidden">
            Nu
          </span>
          <span className="max-lg:sr-only">{nowLabel}</span>
        </Link>
      )}
      <Link href={next} aria-label="Volgende week" className={arrow}>
        <ChevronRight className="size-5 lg:size-4" strokeWidth={1.75} />
      </Link>
    </nav>
  );
}
