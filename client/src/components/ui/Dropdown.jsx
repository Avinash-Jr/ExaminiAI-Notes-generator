import { useEffect, useRef, useState } from "react";
export function Dropdown({ trigger, children, align = "end" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div className={`absolute top-full mt-2 z-40 min-w-48 rounded-panel border border-line bg-sheet shadow-float p-1 ${align === "end" ? "right-0" : "left-0"}`} role="menu">
          {children}
        </div>
      )}
    </div>
  );
}
export function DropdownItem({ children, onClick, danger, disabled }) {
  return (
    <button role="menuitem" disabled={disabled} onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-chip text-sm transition-colors disabled:opacity-50 ${danger ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-band"}`}>
      {children}
    </button>
  );
}
export default Dropdown;
