import { motion } from "motion/react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { TfiMicrosoftAlt } from "react-icons/tfi";
import { auth, provider } from "../utils/firebase.js";
import { signInWithPopup } from "firebase/auth";
import axios from "axios";
import { serverUrl } from "../App.jsx";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice.js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Turns whatever was thrown into a line the person in front of the screen can
 * act on. Returns null when there is genuinely nothing to report.
 */
function describeAuthError(error) {
  /* Closing the Google popup is a decision, not a failure. */
  if (
    error.code === "auth/popup-closed-by-user" ||
    error.code === "auth/cancelled-popup-request"
  ) {
    return null;
  }

  if (error.code === "auth/popup-blocked") {
    return "Your browser blocked the Google popup. Allow popups for this site, then try again.";
  }

  /* The server answered, but not with a success. */
  if (error.response) {
    const detail =
      error.response.data?.message || `status ${error.response.status}`;

    return `Google accepted you, but signing in to ExaminAI failed — ${detail}.`;
  }

  /* The request left the browser and nothing came back. */
  if (error.request) {
    return "Could not reach the ExaminAI server. Please try again.";
  }

  return error.message || "Something went wrong signing in. Please try again.";
}

function Auth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleAuth = async () => {
    setError(null);
    setPending(true);

    try {
      console.log("🔵 Starting Google authentication...");

      // 1. Firebase authentication
      const response = await signInWithPopup(auth, provider);

      const firebaseUser = response.user;

      const name = firebaseUser.displayName || "User";
      const email = firebaseUser.email;

      console.log("✅ Firebase User:", {
        name,
        email,
        uid: firebaseUser.uid,
      });

      if (!email) {
        throw new Error("Google account did not return an email address.");
      }

      // The ID token is what the backend verifies — never trust email/name alone.
      const idToken = await firebaseUser.getIdToken();

      // 2. Send authenticated user to your backend
      console.log("🔵 Sending user to backend...");

      const result = await axios.post(
        `${serverUrl}/api/auth/googleAuth`,
        {
          idToken,
          name,
          email,
        },
        {
          withCredentials: true,
        }
      );

      console.log("✅ Backend response:", result.data);

      /*
       * Your backend might return:
       *   { user: {...} }
       * or
       *   { userData: {...} }
       * or directly:
       *   {...user}
       *
       * Handle all common cases.
       */
      const backendUser =
        result.data?.userData ||
        result.data?.user ||
        result.data;

      if (!backendUser) {
        throw new Error("Backend did not return user data.");
      }

      // 3. Save logged-in user in Redux
      dispatch(setUserData(backendUser));

      console.log("✅ User saved to Redux:", backendUser);

      /* Send them to the app. The /auth route also redirects on its own once
         userData is set, but navigating here means the redirect no longer
         depends on that guard staying in place. */
      navigate("/", { replace: true });
    } catch (error) {
      console.error("❌ Google Authentication Error");

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Backend:", error.response.data);
      } else if (error.request) {
        console.error("No response from backend:", error.request);
      } else {
        console.error("Error:", error.message);
      }

      /* Without this the page sat there looking idle, which is exactly how a
         failed sign-in used to look like "nothing happened". */
      setError(describeAuthError(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-amber-100 text-black px-6 sm:px-8">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
        className="max-h-screen mt-11 overflow-hidden rounded-2xl p-6 bg-linear-to-br from-black via-gray-900 to-black border border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
        style={{ transformStyle: "preserve-3d" }}
      >
        <h1 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
          ExaminiAI Notes Generator
        </h1>

        <p className="mt-1 text-sm sm:text-base text-gray-300">
          AI-powered exam notes & your personal revision buddy
        </p>
      </motion.header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -65 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/10 border border-black/10 text-sm font-semibold mb-6">
              ✨ Learn Smarter. Revise Faster.
            </div>

            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[0.95] bg-linear-to-br from-black via-gray-700 to-black bg-clip-text text-transparent">
              Turn Your
              <br />
              <span className="text-black">Study Material</span>
              <br />
              Into Smart AI Notes
            </h2>

            <p className="mt-6 max-w-2xl text-lg sm:text-xl font-medium text-gray-700 leading-relaxed">
              Generate exam-ready notes, project documentation, charts,
              summaries and downloadable PDFs — powered by AI and built for
              students.
            </p>

            {/* LOGIN BUTTONS */}
            <motion.button
              type="button"
              onClick={handleGoogleAuth}
              disabled={pending}
              aria-busy={pending}
              whileHover={
                pending
                  ? undefined
                  : {
                      y: -10,
                      rotateX: 8,
                      rotateY: -8,
                      scale: 1.07,
                    }
              }
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 10,
              }}
              whileTap={pending ? undefined : { scale: 0.97 }}
              className="mt-10 px-10 py-3 rounded-xl flex items-center gap-3 bg-white border border-black/10 font-semibold text-lg shadow-[0_25px_60px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FcGoogle size={22} />

              <span className="font-semibold text-xl text-black">
                {pending ? "Signing you in…" : "Continue with Google"}
              </span>
            </motion.button>

            <motion.button
              type="button"
              disabled
              title="GitHub login coming soon"
              whileHover={{
                y: -3,
              }}
              className="mt-10 ml-3 px-10 py-3 rounded-xl flex items-center gap-3 bg-white border border-black/10 font-semibold text-lg shadow-[0_25px_60px_rgba(0,0,0,0.25)] opacity-50 cursor-not-allowed relative"
            >
              <FaGithub size={22} />

              <span className="font-semibold text-xl text-black">
                Continue with Github
              </span>
              <span className="absolute -top-2 -right-2 rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white">Soon</span>
            </motion.button>

            <motion.button
              type="button"
              disabled
              title="Microsoft login coming soon"
              whileHover={{
                y: -3,
              }}
              className="mt-10 ml-3 px-10 py-3 rounded-xl flex items-center gap-3 bg-white border border-black/10 font-semibold text-lg shadow-[0_25px_60px_rgba(0,0,0,0.25)] opacity-50 cursor-not-allowed relative"
            >
              <TfiMicrosoftAlt size={22} />

              <span className="font-semibold text-xl text-black">
                Continue with Microsoft
              </span>
              <span className="absolute -top-2 -right-2 rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white">Soon</span>
            </motion.button>

            {/* SIGN-IN ERROR */}
            {error ? (
              <p
                role="alert"
                className="mt-8 max-w-xl rounded-2xl border border-red-900/25 bg-red-50 px-5 py-4 text-base font-medium text-red-900"
              >
                {error}
              </p>
            ) : null}

            {/* CREDIT MESSAGE */}
            <div className="mt-8 p-5 max-w-xl rounded-2xl bg-black/5 border border-black/10">
              <p className="text-base sm:text-lg font-medium text-gray-800 leading-relaxed">
                🎁 Get{" "}
                <span className="font-bold text-black">
                  100 FREE Credits
                </span>{" "}
                to create AI-powered notes, project documentation, charts,
                graphs and clean PDFs instantly.
              </p>

              <p className="mt-3 text-sm text-gray-600">
                Free to start • No payment required • Upgrade anytime
              </p>
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 65 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-600">
                Why ExaminiAI?
              </p>

              <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold">
                Everything You Need to
                <span className="block bg-linear-to-r from-gray-800 to-black bg-clip-text text-transparent">
                  Study Smarter
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Feature
                icon="🎁"
                title="100 Free Credits"
                des="Start instantly with 100 free credits and experience powerful AI note generation without paying."
              />

              <Feature
                icon="🎯"
                title="Exam-Ready Notes"
                des="Generate high-yield, revision-friendly notes focused on the concepts that matter most."
              />

              <Feature
                icon="🚀"
                title="Project Documentation"
                des="Create clean, professional documentation for assignments, projects and submissions in seconds."
              />

              <Feature
                icon="⚡"
                title="AI-Powered Learning"
                des="Turn lengthy study material into clear, structured and easy-to-understand notes with AI."
              />

              <Feature
                icon="📊"
                title="Charts & Visuals"
                des="Create structured charts, graphs and visual learning material to understand topics faster."
              />

              <Feature
                icon="📥"
                title="Save & Download"
                des="Organize your notes and download polished PDFs whenever you need them for revision."
              />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, des }) {
  return (
    <motion.div
      whileHover={{
        y: -10,
        rotateX: 8,
        rotateY: -8,
        scale: 1.07,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 10,
      }}
      className="group relative overflow-hidden rounded-2xl p-6 bg-linear-to-br from-black via-gray-900 to-black border border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative z-10 text-3xl mb-3">
        {icon}
      </div>

      <h3 className="relative z-10 text-xl font-semibold mb-2">
        {title}
      </h3>

      <p className="relative z-10 text-gray-300 text-sm leading-relaxed">
        {des}
      </p>
    </motion.div>
  );
}

export default Auth;