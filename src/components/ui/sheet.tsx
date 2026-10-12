"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useSyncExternalStore } from "react";
import { X } from "lucide-react";

const PHONE = "(max-width: 1023px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(PHONE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** True below the desktop breakpoint, where the book folds into one page. */
export function usePhone() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

/**
 * Phone: a panel that slides up from the bottom edge, scrolls on its own and
 * never runs off screen. Swipe-free: tap the backdrop or the close button.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[oklch(0.15_0.02_163/0.4)] data-[state=open]:animate-[fade_150ms_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[min(88dvh,calc(100dvh-env(safe-area-inset-top)-1rem))] flex-col rounded-t-lg border-t border-rule bg-paper text-ink shadow-lift outline-none data-[state=open]:animate-[sheet_220ms_var(--ease-out)]"
        >
          <div className="flex shrink-0 items-center gap-2 px-4 pb-1 pt-2">
            <span aria-hidden className="absolute left-1/2 top-1.5 h-1 w-9 -translate-x-1/2 rounded-full bg-rule-strong" />
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            <Dialog.Close
              aria-label="Sluiten"
              className="ml-auto mt-1 grid size-9 place-items-center rounded-full text-ink-2 hover:bg-paper-3 hover:text-ink"
            >
              <X className="size-4" strokeWidth={2} />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
