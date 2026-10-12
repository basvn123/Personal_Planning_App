import { cx } from "@/lib/cx";

/**
 * The satin ribbon marker. It runs down the page through every block above
 * today ("through") and ends with a forked tail on today's row ("tail").
 */
export function Ribbon({ kind }: { kind: "through" | "tail" }) {
  return (
    <span
      aria-hidden
      className={cx(
        "pointer-events-none absolute -top-px right-3 z-10 w-3.5 bg-ribbon lg:right-4",
        "bg-[linear-gradient(90deg,var(--ribbon-2)_0,var(--ribbon)_30%,var(--ribbon)_70%,var(--ribbon-2)_100%)]",
        kind === "through"
          ? "-bottom-px"
          : "-bottom-3 [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-7px),0_100%)] drop-shadow-[0_2px_1px_oklch(0.2_0.05_70/0.25)]",
      )}
    />
  );
}
