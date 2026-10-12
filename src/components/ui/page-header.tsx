import { InfoButton } from "@/components/help/info-button";
import type { HelpTopic } from "@/components/help/content";
import { cx } from "@/lib/cx";

/** The same title, info button and actions at the top of every page. */
export function PageHeader({
  title,
  subtitle,
  info,
  actions,
  lead,
  className,
  as: Tag = "h1",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  info?: HelpTopic;
  actions?: React.ReactNode;
  /** Something before the title, such as a section's color bar. */
  lead?: React.ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    // When the actions don't fit next to the title, they wrap to their own row instead of squeezing it.
    <header className={cx("flex flex-wrap items-start gap-x-3 gap-y-2 px-1", className)}>
      {lead}
      <div className="min-w-[8.5rem] flex-1">
        <Tag
          className={cx(
            "flex items-center gap-1.5 font-bold leading-tight tracking-[-0.025em] text-ink [overflow-wrap:break-word]",
            Tag === "h1" ? "text-2xl" : "text-lg lg:text-xl",
          )}
        >
          <span className="min-w-0 first-letter:uppercase">{title}</span>
          {info && <InfoButton topic={info} />}
        </Tag>
        {subtitle && <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-ink-2">{subtitle}</div>}
      </div>
      {actions && <div className="ml-auto flex shrink-0 items-center gap-0.5">{actions}</div>}
    </header>
  );
}
