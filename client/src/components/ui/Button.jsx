import { cx } from "../../lib/cx.js";

const variants = {
  solid: "bg-ink text-white border border-ink hover:bg-black",
  outline:
    "bg-sheet text-ink border border-line-firm hover:border-ink hover:shadow-sm",
  accent:
    "bg-brand text-white border border-brand hover:bg-brand-deep hover:border-brand-deep",
  quiet:
    "bg-transparent text-brand border border-transparent hover:bg-brand-tint",
};

const sizes = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
};

/**
 * Labels name the action that happens on press — "Send message", not "Submit".
 * Pass `as={Link}` for navigation that looks like a button.
 */
export default function Button({
  as: Tag = "button",
  variant = "solid",
  size = "md",
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-chip font-semibold",
        "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
