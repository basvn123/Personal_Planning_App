"use client";

import { useEffect, useState } from "react";
import { useUi } from "@/lib/ui-store";

/**
 * One short line that floats above the bottom bar, then fades. A toast with an
 * action (undo) stays five seconds and its button can be tapped.
 */
export function Toaster() {
  const toast = useUi((s) => s.toast);
  const [shown, setShown] = useState<typeof toast>(null);

  useEffect(() => {
    if (!toast) return;
    setShown(toast);
    const t = setTimeout(() => setShown((cur) => (cur?.id === toast.id ? null : cur)), toast.action ? 5000 : 1800);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div
      aria-live="polite"
      className="toast-bottom pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4 lg:bottom-6"
    >
      {shown &&
        (shown.action ? (
          <span
            key={shown.id}
            className="figures pointer-events-auto flex items-center gap-1 rounded-md bg-ink py-1 pl-3.5 pr-1 text-sm font-medium text-paper shadow-lift animate-[rise_180ms_var(--ease-out)]"
          >
            {shown.text}
            <button
              type="button"
              onClick={() => {
                shown.action!.run();
                setShown(null);
              }}
              className="ml-2 h-8 rounded-sm px-2.5 font-semibold text-ribbon underline-offset-2 hover:bg-paper/10 hover:underline"
            >
              {shown.action.label}
            </button>
          </span>
        ) : (
          <span
            key={shown.id}
            className="figures rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-paper shadow-lift animate-[toast_1800ms_var(--ease-out)_forwards]"
          >
            {shown.text}
          </span>
        ))}
    </div>
  );
}
