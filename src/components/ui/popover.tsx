"use client";

import * as P from "@radix-ui/react-popover";
import { cx } from "@/lib/cx";

export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export const PopoverClose = P.Close;
export const PopoverAnchor = P.Anchor;

export function PopoverContent({
  className,
  children,
  ...props
}: P.PopoverContentProps) {
  return (
    <P.Portal>
      <P.Content
        sideOffset={6}
        collisionPadding={12}
        {...props}
        className={cx(
          // Never taller than the room left on screen; long content scrolls inside.
          "z-50 max-h-[var(--radix-popover-content-available-height)] overflow-y-auto overscroll-contain rounded-lg border border-rule bg-card p-3 text-ink shadow-lift outline-none",
          "data-[state=open]:animate-[pop_160ms_var(--ease-out)]",
          className,
        )}
      >
        {children}
      </P.Content>
    </P.Portal>
  );
}
