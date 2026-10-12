import { cx } from "@/lib/cx";

/**
 * Two facing pages. Desktop shows both with a gutter; on a phone the pages
 * sit side by side in a horizontal snap scroller, so you swipe between them.
 */
export function Spread({
  left,
  right,
  leftLabel,
  rightLabel,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div className="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] lg:grid lg:grid-cols-2 lg:overflow-hidden">
      <Page side="left" label={leftLabel}>
        {left}
      </Page>
      <Page side="right" label={rightLabel}>
        {right}
      </Page>
    </div>
  );
}

function Page({
  side,
  label,
  children,
}: {
  side: "left" | "right";
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className={cx(
        "paper relative h-full w-full shrink-0 snap-start overflow-y-auto overscroll-contain lg:w-auto",
        side === "left"
          ? "lg:shadow-[inset_-28px_0_28px_-24px_var(--gutter-shade)]"
          : "bg-paper-2 lg:shadow-[inset_28px_0_28px_-24px_var(--gutter-shade)]",
      )}
    >
      {children}
    </section>
  );
}
