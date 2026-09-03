import { cx } from "../../lib/cx.js";

const surfaces = {
  /* Default content block: white sheet on the light canvas. */
  sheet: "bg-sheet border border-line rounded-panel",
  /* Dark panel, the same material as the navbar and footer. */
  panel:
    "bg-linear-to-br from-panel via-panel-2 to-panel border border-white/10 rounded-panel text-white",
  /* Secondary information that should not compete with a sheet. */
  tint: "bg-brand-tint border border-brand/15 rounded-panel",
  /* Nothing here yet, or nothing matched a filter. */
  dashed: "border border-dashed border-line-firm rounded-panel",
};

const paddings = {
  none: "",
  snug: "p-5 sm:p-6",
  roomy: "p-6 sm:p-9",
};

/**
 * A content block. Radius and padding are chosen by role rather than passed
 * per use, so every block on the site reads as the same material.
 */
export default function Panel({
  as: Tag = "div",
  surface = "sheet",
  padding = "roomy",
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cx(surfaces[surface], paddings[padding], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
