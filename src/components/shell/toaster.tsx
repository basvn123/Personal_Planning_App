"use client";

import { useEffect, useState } from "react";
import { useUi } from "@/lib/ui-store";

/** One short line that floats above the bottom bar, then fades. */
export function Toaster() {
  const toast = useUi((s) => s.toast);
  const [shown, setShown] = useState<typeof toast>(null);

  useEffect(() => {
    if (!toast) return;
    setShown(toast);
    const t = setTimeout(() => setShown((cur) => (cur?.id === toast.id ? null : cur)), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 lg:bottom-6"
    >
      {shown && (
        <span
          key={shown.id}
          className="figures rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-paper shadow-lift animate-[toast_1800ms_var(--ease-out)_forwards]"
        >
          {shown.text}
        </span>
      )}
    </div>
  );
}
