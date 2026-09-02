import { AnimatePresence, motion } from "motion/react";
import { useSelector, useDispatch } from "react-redux";
import { BsPatchPlusFill } from "react-icons/bs";
import axios from "axios";
import { serverUrl } from "../App.jsx";
import logo from "../assets/logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setUserData } from "../redux/userSlice.js";

function Navbar() {
  const { userData } = useSelector((state) => state.user);

  const [showCredits, setShowCredits] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [setShowHistory] = useState(false);
  const [ setShowSettings] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const credits = userData?.credits ?? 100;

  const handleLogout = async () => {
    try {
      console.log("🔵 Logging out...");

      await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });

      dispatch(setUserData(null));

      setShowProfile(false);
      setShowCredits(false);

      navigate("/auth", { replace: true });

      console.log("✅ Logged out successfully");
    } catch (error) {
      console.error("❌ Logout failed:", error.response?.data || error.message);

      // Clear Redux even if backend logout fails.
      dispatch(setUserData(null));
      navigate("/auth", { replace: true });
    }
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
        mt-6 mx-6
        rounded-2xl
        bg-linear-to-br from-black/90 to-black/90
        backdrop-blur-2xl
        border border-white/10
        shadow-[0_22px_55px_rgba(0,0,0,0.75)]
        flex items-center justify-between
        px-8 py-4
      "
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <img
          src={logo}
          alt="ExamNotes AI logo"
          className="
            w-11 h-11
            rounded-xl
            object-cover
            border border-white/10
            shadow-lg
          "
        />

        <span className="text-2xl text-gray-300 font-bold">
          ExamNotes{" "}
          <span className="text-amber-100">AI</span>
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6 relative">
        {/* Credits */}
        <div className="relative">
          <motion.div
            onClick={() => {
              setShowCredits((prev) => !prev);
              setShowProfile(false);
            }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 1.01 }}
            className="
              flex items-center justify-center
              gap-2
              px-4 py-2
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
            <span className="text-xl">💎</span>

            <span className="font-semibold">
              {credits}
            </span>

            <motion.span
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.99 }}
              className="text-xl"
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
                  absolute right-[-10px] mt-4
                  w-64 rounded-2xl
                  bg-black/90
                  backdrop-blur-xl
                  border border-white/10
                  shadow-[0_25px_60px_rgba(0,0,0,0.7)]
                  p-4 text-white
                "
              >
                <h4 className="text-2xl">
                  Buy Credits
                </h4>

                <p className="text-lg text-gray-400 mb-4">
                  Use Credits to generate AI Notes, Diagrams & PDFs
                </p>

                <button
                  onClick={() => setShowCredits(false)}
                  className="
                    w-full py-4 rounded-lg
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
        <div className="relative">
          <motion.div
            onClick={() => {
              setShowProfile((prev) => !prev);
              setShowCredits(false);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 1.01 }}
            className="
              flex items-center justify-center
              gap-1 px-4 py-2 rounded-full
              bg-white/10
              border border-white/20
              text-white text-sm
              shadow-md cursor-pointer
            "
          >
            <span className="text-lg font-bold">
              {firstLetter}
            </span>

            <AnimatePresence>
              {showProfile && (
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
                    absolute right-0 top-full mt-4
                    w-52 rounded-2xl
                    bg-black/90
                    backdrop-blur-xl
                    border border-white/10
                    shadow-[0_25px_60px_rgba(0,0,0,0.7)]
                    p-4 text-white
                  "
                >
                  <MenuItem
                    text="History"
                    onClick={() => {
                      setShowHistory(true);
                      setShowProfile(false);
                    }}
                  />

                  <MenuItem
                    text="Settings"
                    onClick={() => {
                      setShowSettings(true);
                      setShowProfile(false);
                    }}
                  />

                  <MenuItem
                    text="Logout"
                    red
                    onClick={handleLogout}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
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