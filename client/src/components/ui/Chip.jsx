import { cx } from "../../lib/cx.js";

/**
 * A small label attached to content — a note's subject, an activity's kind.
 * Tighter radius than the panel it sits on, so hierarchy stays readable.
 */
export default function Chip({
  as: Tag = "span",
  active = false,
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cx(
        "inline-flex items-center rounded-chip border px-2.5 py-1 text-fine transition-colors duration-150",
        active
          ? "border-brand bg-brand text-white"
          : "border-line bg-sheet text-ink-3 hover:border-line-firm hover:text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
