import { cx } from "@/lib/cx";

type Variant = "primary" | "quiet" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-cloth text-cloth-ink hover:bg-cloth-3 disabled:opacity-50",
  quiet: "border border-rule-strong bg-paper text-ink hover:bg-paper-3 disabled:opacity-50",
  danger: "bg-danger text-paper hover:opacity-90 disabled:opacity-50",
  ghost: "text-ink-2 hover:bg-paper-3 hover:text-ink disabled:opacity-40",
};

export function Button({
  variant = "quiet",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-sm px-3 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed",
        VARIANTS[variant],
        className,
      )}
    />
  );
}

export function IconButton({
  label,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cx(
        "grid size-8 place-items-center rounded-sm text-ink-2 transition-colors duration-150 hover:bg-paper-3 hover:text-ink disabled:opacity-40",
        className,
      )}
    />
  );
}

export const inputClass =
  "h-9 w-full rounded-sm border border-rule-strong bg-paper px-2.5 text-base text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-cloth-3";
