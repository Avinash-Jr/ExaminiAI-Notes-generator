import { AnimatePresence, motion } from "motion/react";
import { useSelector, useDispatch } from "react-redux";
import { BsPatchPlusFill } from "react-icons/bs";
import { FiLayout } from "react-icons/fi";
import logo from "../assets/logo.png";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../services/api.js";
import ThemeToggle from "./ThemeToggle.jsx";

function Navbar() {
  const { userData } = useSelector((state) => state.user);

  const [showCredits, setShowCredits] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const creditsRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (creditsRef.current && !creditsRef.current.contains(e.target)) {
        setShowCredits(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const credits = userData?.credits ?? 100;

  const handleLogout = async () => {
    setShowProfile(false);
    setShowCredits(false);
    await logout(dispatch);
    navigate("/auth", { replace: true });
  };

  const firstLetter =
    userData?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="
        sticky top-4 z-40
        mx-4 sm:mx-6 lg:mx-auto lg:max-w-7xl
        rounded-2xl
        bg-black/90
        backdrop-blur-2xl
        border border-white/10
        shadow-[0_22px_55px_rgba(0,0,0,0.75)]
        flex items-center justify-between gap-3
        px-4 py-3 sm:px-6 sm:py-3.5
      "
    >
      {/* Logo */}
      <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3 group">
        <img
          src={logo}
          alt="ExamNotes AI logo"
          className="
            w-9 h-9 sm:w-10 sm:h-10
            shrink-0
            rounded-xl
            object-cover
            border border-white/10
            shadow-lg
            group-hover:scale-105
            transition-transform
          "
        />

        <span className="truncate text-base sm:text-xl text-gray-200 font-bold tracking-tight">
          ExamNotes <span className="text-amber-300">AI</span>
        </span>
      </Link>

      {/* Mid navigation links (marketing) */}
      <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300 font-medium">
        <Link to="/#features" className="hover:text-white transition-colors">
          Features
        </Link>
        <Link to="/pricing" className="hover:text-white transition-colors">
          Pricing
        </Link>
        <Link to="/about" className="hover:text-white transition-colors">
          About
        </Link>
        <Link to="/contact" className="hover:text-white transition-colors">
          Contact
        </Link>
      </nav>

      {/* Right side controls */}
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-4 relative">
        <ThemeToggle className="text-white border-white/10 bg-white/5 hover:bg-white/10" />

        {userData ? (
          <>
            {/* Go to workspace dashboard link */}
            <Link
              to="/notes"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-all"
            >
              <FiLayout className="size-3.5 text-amber-300" />
              <span>Workspace</span>
            </Link>

            {/* Credits pill */}
            <div className="relative" ref={creditsRef}>
              <motion.div
                onClick={() => {
                  setShowCredits((prev) => !prev);
                  setShowProfile(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="
                  flex items-center justify-center
                  gap-1.5 sm:gap-2
                  px-3 py-1.5 sm:px-3.5 sm:py-1.5
                  rounded-xl
                  bg-white/10
                  border border-white/20
                  text-white
                  text-xs sm:text-sm
                  shadow-md
                  cursor-pointer
                  transition-colors
                  hover:bg-white/15
                "
              >
                <span className="text-sm sm:text-base">💎</span>
                <span className="font-semibold">{credits}</span>
                <span className="hidden sm:inline-block text-amber-300">
                  <BsPatchPlusFill />
                </span>
              </motion.div>

              <AnimatePresence>
                {showCredits && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 10, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="
                      absolute right-0 mt-3
                      w-64 max-w-[calc(100vw-3rem)]
                      rounded-2xl
                      bg-neutral-950
                      border border-white/15
                      shadow-[0_25px_60px_rgba(0,0,0,0.85)]
                      p-4 text-white z-50
                    "
                  >
                    <h4 className="text-lg font-bold">Credit Balance</h4>
                    <p className="text-xs text-gray-400 mt-1 mb-4">
                      Each AI generation uses credits for analysis, summaries & diagram generation.
                    </p>
                    <button
                      onClick={() => { setShowCredits(false); navigate("/pricing"); }}
                      className="
                        w-full py-2.5 rounded-xl
                        bg-amber-400 hover:bg-amber-300
                        text-black font-semibold text-xs tracking-wide
                        transition-colors
                      "
                    >
                      Top Up Credits →
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar & Dropdown */}
            <div className="relative" ref={profileRef}>
              <motion.div
                onClick={() => {
                  setShowProfile((prev) => !prev);
                  setShowCredits(false);
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.98 }}
                className="
                  flex items-center justify-center
                  h-8 w-8 sm:h-9 sm:w-9 rounded-full
                  bg-amber-400/20 border border-amber-400/30
                  text-amber-300 text-xs sm:text-sm font-bold
                  cursor-pointer shadow-md
                "
              >
                {firstLetter}
              </motion.div>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 10, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="
                      absolute right-0 top-full mt-3
                      w-52 max-w-[calc(100vw-3rem)] rounded-2xl
                      bg-neutral-950
                      border border-white/15
                      shadow-[0_25px_60px_rgba(0,0,0,0.85)]
                      p-2 text-white z-50
                    "
                  >
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-xs font-semibold text-gray-200 truncate">
                        {userData?.name || "Scholar"}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {userData?.email}
                      </p>
                    </div>

                    <MenuItem
                      text="Notes Library"
                      onClick={() => { setShowProfile(false); navigate("/notes"); }}
                    />
                    <MenuItem
                      text="Activity History"
                      onClick={() => { setShowProfile(false); navigate("/history"); }}
                    />
                    <MenuItem
                      text="Account Settings"
                      onClick={() => { setShowProfile(false); navigate("/settings"); }}
                    />
                    <div className="my-1 border-t border-white/10" />
                    <MenuItem text="Sign Out" red onClick={handleLogout} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="text-xs sm:text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs sm:text-sm font-semibold px-3.5 py-1.5 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </motion.header>
  );
}

function MenuItem({ onClick, text, red = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left px-3 py-2 text-xs transition-colors rounded-lg
        ${red ? "text-red-400 hover:bg-red-500/10 font-medium" : "text-gray-200 hover:bg-white/10"}
      `}
    >
      {text}
    </button>
  );
}

export default Navbar;