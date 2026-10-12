import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";

/** What an empty card says: one line on what goes here, and usually the way to add it. */
export function EmptyState({
  icon: Icon,
  text,
  action,
  className,
}: {
  icon?: LucideIcon;
  text: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center gap-2 py-4 text-center", className)}>
      {Icon && <Icon aria-hidden className="size-5 text-ink-3" strokeWidth={1.75} />}
      <p className="max-w-[28ch] text-sm text-ink-3">{text}</p>
      {action}
    </div>
  );
}

export const emptyActionClass =
  "mt-1 inline-flex h-10 items-center gap-1.5 rounded-full bg-[color-mix(in_oklch,var(--link)_12%,transparent)] px-4 text-sm font-medium text-[var(--link)] transition-colors hover:bg-[color-mix(in_oklch,var(--link)_20%,transparent)] disabled:opacity-50 lg:h-8";

/** The small tinted button an empty state offers. */
export function EmptyAction({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const className = emptyActionClass;
  if (href)
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
