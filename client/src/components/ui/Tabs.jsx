import { cx } from "../../lib/cx.js";
export function Tabs({ tabs = [], active, onChange, className }) {
  return (
    <div role="tablist" className={cx("flex gap-1 rounded-chip bg-band p-1", className)}>
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={active === t.value} onClick={() => onChange?.(t.value)}
          className={cx("rounded-chip px-3.5 py-1.5 text-sm font-semibold transition-colors", active === t.value ? "bg-sheet text-ink shadow-sm border border-line" : "text-ink-3 hover:text-ink")}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
export default Tabs;
