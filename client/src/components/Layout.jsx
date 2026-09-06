import { useEffect } from "react";
import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import { motion } from "motion/react";
import { useSelector } from "react-redux";

import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import Container from "./ui/Container.jsx";
import logo from "../assets/logo.png";

/**
 * Pages reachable from the thin nav row. Notes, History and Settings belong to
 * an account, so they only appear once someone is signed in. Footer carries the
 * policy links for everyone.
 */
const pages = [
  { to: "/notes", label: "Notes", private: true },
  { to: "/history", label: "History", private: true },
  { to: "/settings", label: "Settings", private: true },
  { to: "/about", label: "About", private: false },
  { to: "/contact", label: "Contact", private: false },
];

/**
 * Shared shell for the content pages: app navbar, a thin page nav, the page
 * itself, and the footer. Landmarks are real elements — header, nav, main,
 * footer — so assistive technology can jump between them.
 *
 * Works as a layout route (rendering the nested route through `Outlet`) or
 * wrapped directly around a page's markup.
 */
export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { userData } = useSelector((state) => state.user);

  /* A new page should start at the top, not wherever the last one was left. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <a
        href="#main"
        className="sr-only rounded-chip focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <header>
        {/* The app navbar carries credits and the profile menu, so it only
            makes sense once someone is signed in. Policy pages have to be
            readable before that, and they get the plain brand header. */}
        {userData ? <Navbar /> : <BrandHeader />}

        <PageNav pathname={pathname} signedIn={Boolean(userData)} />
      </header>

      <motion.main
        key={pathname}
        id="main"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex-1"
      >
        {children ?? <Outlet />}
      </motion.main>

      <Footer />
    </div>
  );
}

/** Signed-out header: the wordmark, a way back, and nothing else. */
function BrandHeader() {
  return (
    <div className="relative z-20 mt-6 mr-6 ml-6 flex items-center justify-between rounded-2xl border border-white/10 bg-linear-to-br from-black/90 to-black/90 px-8 py-4 shadow-[0_22px_55px_rgba(0,0,0,0.75)]">
      <Link to="/" className="flex items-center gap-3">
        <img
          src={logo}
          alt=""
          className="h-11 w-11 rounded-xl border border-white/10 object-cover shadow-lg"
        />

        <span className="text-2xl font-bold text-gray-300">
          ExamNotes <span className="text-amber-100">AI</span>
        </span>
      </Link>

      <Link
        to="/auth"
        className="rounded-chip border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15"
      >
        Sign in
      </Link>
    </div>
  );
}

function PageNav({ pathname, signedIn }) {
  const visible = pages.filter((page) => signedIn || !page.private);

  return (
    <nav aria-label="Pages" className="mt-6 border-b border-line">
      <Container>
        <ul className="-mb-px flex gap-7 overflow-x-auto">
          {visible.map((page) => {
            const current = pathname === page.to;

            return (
              <li key={page.to} className="shrink-0">
                <NavLink
                  to={page.to}
                  aria-current={current ? "page" : undefined}
                  className={`inline-block border-b-2 py-3 text-sm transition-colors ${
                    current
                      ? "border-brand font-semibold text-ink"
                      : "border-transparent text-ink-3 hover:border-line-firm hover:text-ink"
                  }`}
                >
                  {page.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </Container>
    </nav>
  );
}
