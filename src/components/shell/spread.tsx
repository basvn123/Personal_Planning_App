"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";

/**
 * Two facing pages. Desktop shows both with a gutter; on a phone the pages
 * sit side by side in a horizontal snap scroller with a two-way switch on top.
 */
export function Spread({
  left,
  right,
  leftLabel,
  rightLabel,
  initial = "left",
  rightPathPattern,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  leftLabel: string;
  rightLabel: string;
  initial?: "left" | "right";
  /** On a phone, flip to the right page whenever the path matches this regex. */
  rightPathPattern?: string;
}) {
  const pathname = usePathname();
  const scroller = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState<"left" | "right">(initial);

  // Before paint, so a page that opens on the right never flashes the left one first.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !window.matchMedia("(max-width: 1023px)").matches) return;
    const wantRight = initial === "right" || (rightPathPattern && new RegExp(rightPathPattern).test(pathname));
    if (wantRight) el.scrollLeft = el.scrollWidth;
    // Back on a page that opens on the left (say, after saving a form): flip back.
    else if (initial === "left" && !rightPathPattern) el.scrollLeft = 0;
  }, [initial, rightPathPattern, pathname]);

  useEffect(() => {
    function onShow(e: Event) {
      const side = (e as CustomEvent<"left" | "right">).detail;
      if (window.matchMedia("(max-width: 1023px)").matches) show(side);
    }
    window.addEventListener("spread:show", onShow);
    return () => window.removeEventListener("spread:show", onShow);
  }, []);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    setCurrent(el.scrollLeft > el.clientWidth / 2 ? "right" : "left");
  }

  function show(side: "left" | "right") {
    scroller.current?.scrollTo({ left: side === "left" ? 0 : scroller.current.scrollWidth, behavior: "smooth" });
  }

  return (
    <div className="flex h-full flex-col">
      <div role="tablist" aria-label="Pagina's" className="flex shrink-0 gap-1 border-b border-rule bg-paper-2 p-1 lg:hidden">
        {(["left", "right"] as const).map((side) => (
          <button
            key={side}
            type="button"
            role="tab"
            aria-selected={current === side}
            onClick={() => show(side)}
            className={cx(
              "h-8 min-w-0 flex-1 truncate rounded-sm px-2 text-sm transition-colors duration-150",
              current === side ? "bg-paper font-medium text-ink shadow-[0_1px_2px_oklch(0.2_0.02_258/0.1)]" : "text-ink-3",
            )}
          >
            {side === "left" ? leftLabel : rightLabel}
          </button>
        ))}
      </div>
      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] lg:grid lg:grid-cols-2 lg:overflow-hidden"
      >
        <Page side="left" label={leftLabel}>
          {left}
        </Page>
        <Page side="right" label={rightLabel}>
          {right}
        </Page>
      </div>
    </div>
  );
}

function Page({ side, label, children }: { side: "left" | "right"; label: string; children: React.ReactNode }) {
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
