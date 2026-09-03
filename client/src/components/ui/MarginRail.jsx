import { cx } from "../../lib/cx.js";

/**
 * The margin rail: the one structural device these pages share.
 *
 * Exam notes get written in margins, so anything that locates a piece of
 * content — a clause number, a date, a timestamp, a step index — sits in a
 * narrow left rail, separated from the reading column by a hairline. It never
 * interrupts the text it labels.
 *
 * Below `md` there is no room for a margin, so the locator stacks above its
 * content and the hairline drops away. Nothing is lost, only restacked.
 */
export default function MarginRail({
  locator,
  screenReaderLabel,
  className,
  children,
}) {
  return (
    <div
      className={cx(
        "grid gap-y-2 md:grid-cols-[var(--spacing-rail)_minmax(0,1fr)] md:gap-y-0",
        className,
      )}
    >
      <div
        className={cx(
          "text-fine text-ink-3 md:border-r md:border-line md:pt-1 md:pr-5 md:text-right",
        )}
      >
        {screenReaderLabel ? (
          <span className="sr-only">{screenReaderLabel} </span>
        ) : null}
        {locator}
      </div>

      <div className="min-w-0 md:pl-7">{children}</div>
    </div>
  );
}
