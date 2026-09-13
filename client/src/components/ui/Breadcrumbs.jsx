import { Link } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";
export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <FiChevronRight className="text-ink-3 size-3.5" aria-hidden="true" />}
            {last || !item.to ? (
              <span className={last ? "font-semibold text-ink" : "text-ink-3"} aria-current={last ? "page" : undefined}>{item.label}</span>
            ) : (
              <Link to={item.to} className="text-ink-3 hover:text-ink hover:underline underline-offset-4">{item.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
