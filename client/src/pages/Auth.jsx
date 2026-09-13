import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { TfiMicrosoftAlt } from "react-icons/tfi";
import { FiCheckCircle, FiArrowLeft, FiAlertCircle, FiShield } from "react-icons/fi";
import { signInWithPopup } from "firebase/auth";
import axios from "axios";
import { auth, provider } from "../utils/firebase.js";
import { serverUrl } from "../App.jsx";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice.js";
import logo from "../assets/logo.png";
import ThemeToggle from "../components/ThemeToggle.jsx";

function describeAuthError(error) {
  if (
    error.code === "auth/popup-closed-by-user" ||
    error.code === "auth/cancelled-popup-request"
  ) {
    return null;
  }
  if (error.code === "auth/popup-blocked") {
    return "Your browser blocked the Google popup. Please allow popups for this site, then try again.";
  }
  if (error.response) {
    const detail =
      error.response.data?.message ||
      error.response.data?.error ||
      `status ${error.response.status}`;
    return `Signing in to ExaminAI failed: ${detail}`;
  }
  if (error.request) {
    return "Could not reach the ExaminAI server. Please check your internet connection.";
  }
  return error.message || "An unexpected error occurred during sign-in. Please try again.";
}

export default function Auth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleAuth = async () => {
    setError(null);
    setPending(true);

    try {
      // 1. Firebase popup authentication
      const response = await signInWithPopup(auth, provider);
      const firebaseUser = response.user;
      const name = firebaseUser.displayName || "Scholar";
      const email = firebaseUser.email;

      if (!email) {
        throw new Error("Google account did not return an email address.");
      }

      const idToken = await firebaseUser.getIdToken();

      // 2. Exchange token with backend
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

      const backendUser =
        result.data?.userData ||
        result.data?.user ||
        result.data;

      if (!backendUser) {
        throw new Error("Backend did not return user data.");
      }

      // 3. Update Redux state
      dispatch(setUserData(backendUser));

      // Navigate to authenticated workspace notes
      navigate("/notes", { replace: true });
    } catch (err) {
      console.error("Authentication error:", err);
      const message = describeAuthError(err);
      if (message) setError(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-sheet text-ink flex flex-col justify-between">
      {/* Top micro-navigation */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-2 hover:text-ink transition-colors"
        >
          <FiArrowLeft className="size-4" />
          <span>Back to Home</span>
        </Link>
        <ThemeToggle className="h-9 w-9" />
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-line bg-surface shadow-float overflow-hidden">
          {/* Left Hero Branding Pane */}
          <div className="lg:col-span-6 bg-ink text-sheet p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-brand/25 blur-3xl" />
            <div className="pointer-events-none absolute right-0 bottom-0 h-48 w-48 rounded-full bg-amber-500/15 blur-2xl" />

            <div className="relative z-10">
              <Link to="/" className="inline-flex items-center gap-3">
                <img
                  src={logo}
                  alt="ExaminAI Logo"
                  className="h-10 w-10 rounded-xl object-cover border border-white/10"
                />
                <span className="text-xl font-bold text-display tracking-tight text-white">
                  ExamNotes <span className="text-brand-lit">AI</span>
                </span>
              </Link>

              <div className="mt-12">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  ⚡ Academic Grade Notes
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white text-display leading-tight">
                  Turn hours of studying into minutes of mastery.
                </h2>
                <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                  Join scholars using ExaminAI to generate Cornell notes, formula cheatsheets, and exam revision guides with instant vector PDF export.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                {[
                  "100 free note credits on sign-up",
                  "Diagrams, tables, and formula sheets",
                  "Downloadable high-resolution PDFs",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-gray-200">
                    <FiCheckCircle className="size-4 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-8 mt-8 border-t border-white/10 text-xs text-gray-400 flex items-center justify-between">
              <span>ExaminAI Cloud</span>
              <span className="flex items-center gap-1">
                <FiShield className="size-3.5 text-emerald-400" /> End-to-end encrypted
              </span>
            </div>
          </div>

          {/* Right Auth Card Pane */}
          <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-sheet">
            <div className="max-w-md w-full mx-auto">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-ink text-display">
                  Welcome to ExaminAI
                </h3>
                <p className="text-xs sm:text-sm text-ink-3 mt-1.5">
                  Sign in or create an account with Google to access your notes library.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 rounded-xl border border-danger-border bg-danger-soft p-3.5 text-xs text-danger flex items-start gap-2.5">
                  <FiAlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span className="flex-1 font-medium">{error}</span>
                </div>
              )}

              {/* Primary Google Login Button */}
              <motion.button
                type="button"
                onClick={handleGoogleAuth}
                disabled={pending}
                whileHover={pending ? undefined : { scale: 1.01 }}
                whileTap={pending ? undefined : { scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-line-firm bg-sheet py-3.5 px-4 text-sm font-semibold text-ink shadow-xs hover:bg-band hover:border-line-firm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FcGoogle className="size-5" />
                <span>{pending ? "Signing you in..." : "Continue with Google"}</span>
              </motion.button>

              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-line" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                  Enterprise SSO
                </span>
                <div className="flex-1 h-px bg-line" />
              </div>

              {/* Secondary SSO Providers (Disabled Stubs) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-2 rounded-xl border border-line bg-band py-2.5 px-3 text-xs font-medium text-ink-3 opacity-60 cursor-not-allowed"
                  title="GitHub SSO coming soon"
                >
                  <FaGithub className="size-4 text-ink-3" />
                  <span>GitHub</span>
                </button>

                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-2 rounded-xl border border-line bg-band py-2.5 px-3 text-xs font-medium text-ink-3 opacity-60 cursor-not-allowed"
                  title="Microsoft Campus SSO coming soon"
                >
                  <TfiMicrosoftAlt className="size-4 text-ink-3" />
                  <span>Microsoft</span>
                </button>
              </div>

              {/* Privacy & Terms notice */}
              <p className="mt-8 text-center text-[11px] text-ink-3 leading-relaxed">
                By continuing, you agree to ExaminAI's{" "}
                <Link to="/terms" className="underline hover:text-ink">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="underline hover:text-ink">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="p-4 text-center text-xs text-ink-3">
        © {new Date().getFullYear()} ExaminAI Inc. All rights reserved.
      </footer>
    </div>
  );
}