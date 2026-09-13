import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../lib/theme.jsx";
export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className={`inline-flex items-center justify-center rounded-chip border p-2 transition-colors ${theme === "dark" ? "border-white/15 bg-white/10 text-white hover:bg-white/15" : "border-line bg-sheet text-ink hover:bg-band"} ${className}`}
    >
      {theme === "dark" ? <FiSun className="size-4" /> : <FiMoon className="size-4" />}
    </button>
  );
}
