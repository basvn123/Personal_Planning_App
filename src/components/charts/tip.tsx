"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type Tip = { x: number; y: number; content: React.ReactNode } | null;
const TipCtx = createContext<(e: React.PointerEvent | React.FocusEvent, content: React.ReactNode | null) => void>(() => {});

/** Positions one tooltip above whichever mark is hovered or focused inside it. */
export function TipArea({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip>(null);
  const show = useCallback((e: React.PointerEvent | React.FocusEvent, content: React.ReactNode | null) => {
    if (!content || !ref.current) return setTip(null);
    const box = ref.current.getBoundingClientRect();
    const mark = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTip({ x: mark.left + mark.width / 2 - box.left, y: mark.top - box.top, content });
  }, []);
  return (
    <TipCtx.Provider value={show}>
      <div ref={ref} className={`relative ${className ?? ""}`} onPointerLeave={() => setTip(null)}>
        {children}
        {tip && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-sm bg-ink px-2.5 py-1.5 text-xs text-paper shadow-lift"
            style={{ left: tip.x, top: tip.y - 6 }}
          >
            {tip.content}
          </div>
        )}
      </div>
    </TipCtx.Provider>
  );
}

/** Spread onto any mark: hover, focus and touch all reveal its tooltip. */
export function useTip(content: React.ReactNode) {
  const show = useContext(TipCtx);
  return {
    onPointerEnter: (e: React.PointerEvent) => show(e, content),
    onFocus: (e: React.FocusEvent) => show(e, content),
    onBlur: (e: React.FocusEvent) => show(e, null),
    tabIndex: 0,
  };
}
