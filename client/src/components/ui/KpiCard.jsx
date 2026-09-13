import Panel from "./Panel.jsx";
import { cx } from "../../lib/cx.js";
export default function KpiCard({ label, value, hint, trend, tone = "neutral", className, children }) {
  const trendTone = trend?.direction === "up" ? "text-success" : trend?.direction === "down" ? "text-danger" : "text-ink-3";
  const borderTone = tone === "brand" ? "border-brand/30 bg-brand-soft/30" : "";
  return (
    <Panel padding="snug" className={cx("flex flex-col", borderTone, className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">{label}</span>
      <span className="mt-2 text-3xl font-bold tracking-tight text-ink text-display" data-numeric>{value}</span>
      {hint ? <span className="mt-1 text-sm text-ink-3">{hint}</span> : null}
      {trend ? <span className={cx("mt-2 text-xs font-semibold", trendTone)}>{trend.label}</span> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </Panel>
  );
}
export function Sparkline({ points = [], className }) {
  if (!points.length) return null;
  const w = 120, h = 36, pad = 2;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const path = points.map((v, i) => {
    const x = pad + (i / Math.max(1, points.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cx("w-full h-9", className)} aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand/70" />
    </svg>
  );
}
