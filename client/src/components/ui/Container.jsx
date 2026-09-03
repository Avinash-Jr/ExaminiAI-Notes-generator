import { cx } from "../../lib/cx.js";

/**
 * Horizontal measure for every page.
 * `width="doc"` is a single reading column; `width="page"` is the wider
 * layout used by list and form pages.
 */
export default function Container({ width = "page", className, children }) {
  return (
    <div
      className={cx(
        "mx-auto w-full px-6 lg:px-8",
        width === "doc" ? "max-w-4xl" : "max-w-5xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
