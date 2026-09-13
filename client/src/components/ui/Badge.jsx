import { cx } from "../../lib/cx.js";
const tones = {
  neutral: "border-line bg-band text-ink-2",
  brand: "border-brand/20 bg-brand-tint text-brand",
  success: "border-success-border bg-success-soft text-success",
  warning: "border-warning-border bg-warning-soft text-warning",
  danger: "border-danger-border bg-danger-soft text-danger",
  info: "border-info-border bg-info-soft text-info",
};
export default function Badge({ tone = "neutral", className, children, ...rest }) {
  return (
    <span className={cx("inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-semibold", tones[tone] || tones.neutral, className)} {...rest}>
      {children}
    </span>
  );
}
