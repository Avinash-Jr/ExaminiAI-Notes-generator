import { cx } from "../../lib/cx.js";

export function Skeleton({ className, ...rest }) {
  return <div className={cx("skeleton", className)} {...rest} />;
}
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cx("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3 w-full" style={{ width: i === lines - 1 ? "72%" : "100%" }} />
      ))}
    </div>
  );
}
export function SkeletonCard({ className }) {
  return (
    <div className={cx("surface-card p-5 sm:p-6", className)} aria-hidden="true">
      <div className="skeleton h-5 w-2/3" />
      <div className="mt-3 space-y-2">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-5/6" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="skeleton h-8 w-20 rounded-chip" />
        <div className="skeleton h-8 w-24 rounded-chip" />
      </div>
    </div>
  );
}
export default Skeleton;
