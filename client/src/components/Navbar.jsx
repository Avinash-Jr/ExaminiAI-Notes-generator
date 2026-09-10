import { AnimatePresence, motion } from "motion/react";
import { useSelector, useDispatch } from "react-redux";
import { BsPatchPlusFill } from "react-icons/bs";
import logo from "../assets/logo.png";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../services/api.js";

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
    /* Close the menu first — it gives immediate feedback while the request is
       still in flight, and once Redux clears this component is unmounted. */
    setShowProfile(false);
    setShowCredits(false);

    /* Clearing the cookie and Redux lives in the shared helper. Two copies of
       that logic is how the navbar and the settings page drift apart. */
    await logout(dispatch);

    navigate("/auth", { replace: true });
  };

  const firstLetter =
    userData?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5 }}
      className="
        relative z-20
        mt-4 mx-4 sm:mt-6 sm:mx-6
        rounded-2xl
        bg-linear-to-br from-black/90 to-black/90
        backdrop-blur-2xl
        border border-white/10
        shadow-[0_22px_55px_rgba(0,0,0,0.75)]
        flex items-center justify-between gap-3
        px-4 py-3 sm:px-8 sm:py-4
      "
    >
      {/* Logo. `min-w-0` lets the wordmark truncate instead of shoving the
          credits pill off the right edge of a phone. */}
      <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
        <img
          src={logo}
          alt="ExamNotes AI logo"
          className="
            w-9 h-9 sm:w-11 sm:h-11
            shrink-0
            rounded-xl
            object-cover
            border border-white/10
            shadow-lg
          "
        />

        <span className="truncate text-base sm:text-2xl text-gray-300 font-bold">
          ExamNotes{" "}
          <span className="text-amber-100">AI</span>
        </span>
      </Link>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-6 relative">
        {/* Credits */}
        <div className="relative" ref={creditsRef}>
          <motion.div
            onClick={() => {
              setShowCredits((prev) => !prev);
              setShowProfile(false);
            }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 1.01 }}
            className="
              flex items-center justify-center
              gap-1.5 sm:gap-2
              px-3 py-1.5 sm:px-4 sm:py-2
              rounded-xl
              bg-white/10
              border border-white/20
              text-white
              text-sm
              shadow-md
              cursor-pointer
              transition-colors
              hover:bg-white/15
            "
          >
            <span className="text-base sm:text-xl">💎</span>

            <span className="font-semibold">
              {credits}
            </span>

            <motion.span
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.99 }}
              className="hidden text-base sm:inline-block sm:text-xl"
            >
              <BsPatchPlusFill />
            </motion.span>
          </motion.div>

          <AnimatePresence>
            {showCredits && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -10,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  y: 10,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                  scale: 0.95,
                }}
                transition={{ duration: 0.3 }}
                className="
                  absolute right-0 mt-4
                  w-64 max-w-[calc(100vw-3rem)]
                  rounded-2xl
                  bg-black/90
                  backdrop-blur-xl
                  border border-white/10
                  shadow-[0_25px_60px_rgba(0,0,0,0.7)]
                  p-4 text-white
                "
              >
                <h4 className="text-xl sm:text-2xl">
                  Buy Credits
                </h4>

                <p className="text-base sm:text-lg text-gray-400 mb-4">
                  Use Credits to generate AI Notes, Diagrams & PDFs
                </p>

                <button
                  onClick={() => {setShowCredits(false); navigate("/pricing")}}
                  className="
                    w-full py-3 sm:py-4 rounded-lg
                    bg-linear-to-br from-white to-pink-300/90
                    text-black font-semibold
                  "
                >
                  Buy More Credits
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <motion.div
            onClick={() => {
              setShowProfile((prev) => !prev);
              setShowCredits(false);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 1.01 }}
            className="
              flex items-center justify-center
              gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full
              bg-white/10
              border border-white/20
              text-white text-sm
              shadow-md cursor-pointer
            "
          >
            <span className="text-lg font-bold">
              {firstLetter}
            </span>
          </motion.div>

          {/* A sibling of the avatar, not a child. Nested inside it, the menu
              inherited the avatar's hover scale, and every click in the menu
              bubbled back to the toggle — reopening what you just chose. */}
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 10, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="
                  absolute right-0 top-full mt-4
                  w-52 max-w-[calc(100vw-3rem)] rounded-2xl
                  bg-black/90
                  backdrop-blur-xl
                  border border-white/10
                  shadow-[0_25px_60px_rgba(0,0,0,0.7)]
                  p-4 text-white
                "
              >
                <MenuItem text="History" onClick={() => {setShowProfile(false); navigate("/history")}}/>

                <MenuItem text="Settings" onClick={() => { setShowProfile(false); navigate("/settings") }}/>

                <MenuItem text="Logout" red onClick={handleLogout}/>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function MenuItem({
  onClick,
  text,
  red = false,
}) {
  return (
    <div
      onClick={onClick}
      className={`
        w-full
        text-left
        px-5
        py-3
        text-sm
        transition-colors
        rounded-lg
        cursor-pointer
        ${
          red
            ? "text-red-400 hover:bg-red-500/10"
            : "text-gray-200 hover:bg-white/10"
        }
      `}
    >
      {text}
    </div>
  );
}

export default Navbar;