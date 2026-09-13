import { cx } from "../../lib/cx.js";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";

export function Table({ columns = [], rows = [], sortKey, sortDir, onSort, empty, className }) {
  return (
    <div className={cx("overflow-x-auto rounded-panel border border-line bg-sheet", className)}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-band">
            {columns.map((col) => (
              <th key={col.key} className={cx("px-4 py-3 font-semibold text-ink-3 whitespace-nowrap", col.sortable && "cursor-pointer select-none hover:text-ink")}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (sortDir === "asc" ? <FiChevronUp className="size-3" /> : <FiChevronDown className="size-3" />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-ink-3">{empty || "No rows."}</td></tr>
          ) : rows.map((row, i) => (
            <tr key={row.id || i} className="border-b border-line last:border-0 hover:bg-band/50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-ink-2">{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default Table;
