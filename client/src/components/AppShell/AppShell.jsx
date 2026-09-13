import { useState, useEffect, useRef } from "react";
import { NavLink, Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FiFileText,
  FiClock,
  FiPlusCircle,
  FiSettings,
  FiCreditCard,
  FiMenu,
  FiX,
  FiSearch,
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiUsers,
  FiZap,
  FiHome,
  FiCompass,
  FiHelpCircle
} from "react-icons/fi";
import logo from "../../assets/logo.png";
import ThemeToggle from "../ThemeToggle.jsx";
import GenerateNotesDialog from "../GenerateNotesDialog.jsx";
import { logout } from "../../services/api.js";

const navItems = [
  { to: "/notes", label: "Notes Library", icon: FiFileText, badge: null },
  { to: "/topic-form", label: "AI Generator", icon: FiZap, badge: "New" },
  { to: "/history", label: "Activity Log", icon: FiClock, badge: null },
  { to: "/pricing", label: "Plans & Credits", icon: FiCreditCard, badge: null },
  { to: "/settings", label: "Settings & Team", icon: FiSettings, badge: null },
];

const secondaryItems = [
  { to: "/about", label: "About Product", icon: FiCompass },
  { to: "/contact", label: "Support & Help", icon: FiHelpCircle },
];

export default function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout(dispatch);
    navigate("/auth", { replace: true });
  };

  const credits = userData?.credits ?? 100;
  const userName = userData?.name || "Student Scholar";
  const userEmail = userData?.email || "scholar@examinai.app";
  const firstLetter = userName.trim().charAt(0).toUpperCase() || "U";

  // Breadcrumbs title
  const currentNav = navItems.find((n) => pathname.startsWith(n.to)) || { label: "Workspace" };

  return (
    <div className="min-h-screen bg-sheet text-ink flex">
      <a
        href="#shell-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white rounded-md"
      >
        Skip to main content
      </a>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-surface transition-all duration-300 ease-premium ${
          collapsed ? "w-20" : "w-64"
        } ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Workspace Brand / Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <img
              src={logo}
              alt="ExaminAI"
              className="h-9 w-9 shrink-0 rounded-xl object-cover border border-line shadow-xs"
            />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="truncate text-base font-bold text-display tracking-tight text-ink">
                  ExamNotes <span className="text-brand">AI</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                  Workspace Pro
                </span>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-ink-3 hover:bg-band hover:text-ink transition-colors"
            aria-label="Close sidebar"
          >
            <FiX className="size-5" />
          </button>
        </div>

        {/* Workspace selector indicator */}
        <div className="px-3 py-3 border-b border-line/60">
          <div className="flex items-center justify-between rounded-xl bg-band border border-line/60 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand font-bold text-xs">
                <FiUsers className="size-3.5" />
              </span>
              {!collapsed && (
                <div className="truncate">
                  <p className="font-semibold text-ink truncate">Personal Org</p>
                  <p className="text-[10px] text-ink-3">Free Tier</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <span className="rounded-md bg-brand/10 text-brand px-1.5 py-0.5 text-[10px] font-bold uppercase">
                Owner
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => setGenerateOpen(true)}
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-ink text-sheet py-2.5 font-semibold text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all ${
              collapsed ? "px-0" : "px-4"
            }`}
            title="Generate AI Notes"
          >
            <FiPlusCircle className="size-4 shrink-0 text-brand-lit" />
            {!collapsed && <span>New Notes</span>}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Sidebar Navigation">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            {!collapsed ? "Core Features" : "•"}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand/10 text-brand font-semibold shadow-xs"
                    : "text-ink-2 hover:bg-band hover:text-ink"
                }`}
              >
                <Icon className={`size-4.5 shrink-0 ${active ? "text-brand" : "text-ink-3"}`} />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="rounded-full bg-brand-soft border border-brand/20 text-brand px-2 py-0.5 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-4 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            {!collapsed ? "General" : "•"}
          </div>

          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-2 hover:bg-band hover:text-ink transition-colors"
            title={collapsed ? "Marketing Home" : undefined}
          >
            <FiHome className="size-4.5 shrink-0 text-ink-3" />
            {!collapsed && <span className="flex-1 truncate">Landing Page</span>}
          </NavLink>

          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand/10 text-brand font-semibold"
                    : "text-ink-2 hover:bg-band hover:text-ink"
                }`}
              >
                <Icon className="size-4.5 shrink-0 text-ink-3" />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer — Credits Pill & Collapse Toggle */}
        <div className="border-t border-line p-3 space-y-3">
          {!collapsed ? (
            <div className="rounded-xl border border-line bg-band p-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-ink-2 flex items-center gap-1">
                  <span>💎</span> Credits Balance
                </span>
                <span className="font-bold text-ink" data-numeric>{credits}</span>
              </div>
              <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(8, (credits / 100) * 100))}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => navigate("/pricing")}
                className="mt-2.5 w-full text-center text-xs font-semibold text-brand hover:underline"
              >
                Upgrade or Add Credits →
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/pricing")}
              className="w-full flex items-center justify-center p-2 rounded-xl bg-band text-brand text-xs font-bold"
              title={`${credits} Credits Remaining`}
            >
              💎 {credits}
            </button>
          )}

          {/* Desktop Collapse Toggle */}
          <div className="hidden lg:flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="text-xs text-ink-3 hover:text-ink flex items-center gap-1.5 p-1 rounded transition-colors"
            >
              <FiMenu className="size-3.5" />
              {!collapsed && <span>Collapse menu</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile menu open */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-ink-2 hover:bg-band hover:text-ink transition-colors"
              aria-label="Open sidebar"
            >
              <FiMenu className="size-5" />
            </button>

            {/* Breadcrumb / Page Title */}
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline-block text-ink-3">Workspace</span>
              <span className="hidden sm:inline-block text-ink-3">/</span>
              <h1 className="font-semibold text-ink text-sm sm:text-base">
                {currentNav.label}
              </h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="hidden md:flex items-center gap-2.5 rounded-xl border border-line bg-band px-3 py-1.5 text-xs text-ink-3 hover:border-line-firm hover:text-ink transition-colors"
            >
              <FiSearch className="size-3.5 text-ink-3" />
              <span>Quick Search...</span>
              <kbd className="rounded border border-line-firm bg-sheet px-1.5 py-0.5 text-[10px] font-semibold text-ink-3 shadow-2xs">
                Ctrl K
              </kbd>
            </button>

            {/* Mobile Search Icon */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="md:hidden p-2 rounded-lg text-ink-3 hover:bg-band hover:text-ink"
              aria-label="Search"
            >
              <FiSearch className="size-5" />
            </button>

            {/* Top Up / Credits Button */}
            <Link
              to="/pricing"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-brand/30 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10 transition-colors"
            >
              <span>💎</span>
              <span data-numeric>{credits}</span>
              <span className="hidden md:inline">credits</span>
            </Link>

            {/* Theme Toggle Button */}
            <ThemeToggle className="h-9 w-9" />

            {/* User Profile Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full p-0.5 border border-line hover:border-line-firm transition-colors focus:ring-2 focus:ring-brand focus:outline-hidden"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label="User profile menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sheet text-xs font-bold shadow-xs">
                  {firstLetter}
                </div>
                <FiChevronDown className="hidden sm:block size-3.5 text-ink-3 pr-1" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-sheet p-2 shadow-float z-50 animate-in fade-in zoom-in-95 duration-150"
                  role="menu"
                >
                  <div className="border-b border-line px-3 py-2 mb-1">
                    <p className="text-sm font-semibold text-ink truncate">{userName}</p>
                    <p className="text-xs text-ink-3 truncate">{userEmail}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setUserMenuOpen(false); navigate("/settings"); }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-ink hover:bg-band transition-colors text-left"
                    role="menuitem"
                  >
                    <FiUser className="size-4 text-ink-3" />
                    Profile & Preferences
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUserMenuOpen(false); navigate("/pricing"); }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-ink hover:bg-band transition-colors text-left"
                    role="menuitem"
                  >
                    <FiCreditCard className="size-4 text-ink-3" />
                    Subscription & Billing
                  </button>

                  <div className="my-1 border-t border-line" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-danger hover:bg-danger-soft transition-colors text-left"
                    role="menuitem"
                  >
                    <FiLogOut className="size-4 text-danger" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* OUTLET / MAIN WORKSPACE CONTENT */}
        <main id="shell-content" className="flex-1 bg-band p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Global Generate Dialog */}
      <GenerateNotesDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
      />

      {/* Command Palette / Quick Search Modal */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-line bg-sheet shadow-panel overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <FiSearch className="size-5 text-ink-3" />
              <input
                type="text"
                autoFocus
                placeholder="Search notes, subjects, features (e.g., Biology, Pricing)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink-3 outline-hidden"
              />
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="text-xs text-ink-3 hover:text-ink px-1.5 py-0.5 rounded border border-line"
              >
                ESC
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                Navigation Shortcuts
              </p>
              {navItems
                .filter((item) =>
                  item.label.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      setSearchModalOpen(false);
                      navigate(item.to);
                    }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-ink hover:bg-band text-left transition-colors"
                  >
                    <item.icon className="size-4 text-brand" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
