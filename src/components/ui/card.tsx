import { Plus, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";

/**
 * The block every page is built from: a white card on the grey canvas with an
 * icon, a title, an optional count and one action on the right. Rows inside
 * are split by hairlines (wrap them in a `divide-y divide-rule` list).
 */
export function Card({
  icon: Icon,
  title,
  count,
  meta,
  action,
  className,
  bodyClassName,
  children,
  id,
}: {
  icon?: LucideIcon;
  title?: React.ReactNode;
  count?: number;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
  id?: string;
}) {
  const hasHeader = Boolean(Icon || title || action);
  return (
    <section
      id={id}
      aria-label={typeof title === "string" ? title : undefined}
      className={cx("rounded-xl border border-rule bg-card shadow-[0_1px_2px_oklch(0.2_0.02_258/0.04)]", className)}
    >
      {hasHeader && <CardHeader icon={Icon} title={title} count={count} meta={meta} action={action} />}
      {children !== undefined && <div className={cx("px-4 pb-3", !hasHeader && "pt-3", bodyClassName)}>{children}</div>}
    </section>
  );
}

export function CardHeader({
  icon: Icon,
  title,
  count,
  meta,
  action,
}: {
  icon?: LucideIcon;
  title?: React.ReactNode;
  count?: number;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex min-h-12 items-center gap-2.5 px-4 pb-1.5 pt-2.5">
      {Icon && <CardIcon icon={Icon} />}
      {title && <h2 className="min-w-0 truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">{title}</h2>}
      {count !== undefined && (
        <span className="figures shrink-0 rounded-full bg-paper-3 px-2 py-px text-xs text-ink-2">{count}</span>
      )}
      {meta && <span className="figures min-w-0 truncate text-xs text-ink-3">{meta}</span>}
      {action && <div className="ml-auto flex shrink-0 items-center gap-0.5">{action}</div>}
    </header>
  );
}

/** The tinted square that carries a card's icon. */
export function CardIcon({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        "grid size-7 shrink-0 place-items-center rounded-md bg-[color-mix(in_oklch,var(--link)_13%,transparent)] text-[var(--link)]",
        className,
      )}
    >
      <Icon className="size-4" strokeWidth={2} />
    </span>
  );
}

/** Round, thumb-sized on the phone: every button in a card header looks like this. */
export const cardActionClass =
  "grid size-10 shrink-0 place-items-center rounded-full text-[var(--link)] transition-colors hover:bg-paper-3 active:bg-paper-3 disabled:opacity-40 lg:size-8";

/** The standard plus in a card header: a thumb-sized target on the phone. */
export function CardAddButton({ label, onClick, className }: { label: string; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx(cardActionClass, className)}
    >
      <Plus className="size-5 lg:size-4" strokeWidth={2.25} />
    </button>
  );
}
