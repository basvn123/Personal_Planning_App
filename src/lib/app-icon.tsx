import { ImageResponse } from "next/og";

/**
 * The app mark as a full-bleed square: an open planner in bottle-green cloth
 * with the marigold ribbon. iOS and Android round the corners themselves.
 */
export function appIcon(size: number, { maskable = false }: { maskable?: boolean } = {}) {
  // Maskable icons get extra padding so Android's circle crop keeps the book whole.
  const inset = maskable ? 0.2 : 0.14;
  const s = size;
  const x0 = s * inset;
  const x1 = s * (1 - inset);
  const y0 = s * (inset + 0.06);
  const y1 = s * (1 - inset - 0.04);
  const mid = s / 2;
  const r = s * 0.035;
  const ribbonX = x1 - s * 0.2;
  const ribbonW = s * 0.085;
  const ribbonEnd = y0 + (y1 - y0) * 0.62;
  const notch = s * 0.045;

  return new ImageResponse(
    (
      <div style={{ width: s, height: s, display: "flex", background: "#1f4a3b" }}>
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          {/* page block shadow */}
          <rect x={x0} y={y0 + s * 0.02} width={x1 - x0} height={y1 - y0} rx={r} fill="#163a2e" />
          {/* left and right pages */}
          <rect x={x0} y={y0} width={mid - x0} height={y1 - y0} rx={r} fill="#f8fafb" />
          <rect x={mid} y={y0} width={x1 - mid} height={y1 - y0} rx={r} fill="#eef1f3" />
          {/* ruled lines */}
          {[0.3, 0.45, 0.6, 0.75].map((f) => (
            <rect key={f} x={x0 + s * 0.06} y={y0 + (y1 - y0) * f} width={mid - x0 - s * 0.11} height={s * 0.012} rx={s * 0.006} fill="#cfd6dc" />
          ))}
          {/* gutter */}
          <rect x={mid - s * 0.008} y={y0} width={s * 0.016} height={y1 - y0} fill="#c3ccd3" />
          {/* ribbon */}
          <path
            d={`M ${ribbonX} ${y0 - s * 0.02} H ${ribbonX + ribbonW} V ${ribbonEnd} L ${ribbonX + ribbonW / 2} ${ribbonEnd - notch} L ${ribbonX} ${ribbonEnd} Z`}
            fill="#f0b43c"
          />
        </svg>
      </div>
    ),
    { width: s, height: s },
  );
}
