import { Link } from "react-router-dom";
import { motion } from "motion/react";

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-sheet px-6 text-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="text-8xl sm:text-9xl font-extrabold tracking-tight text-ink/10">
        404
      </h1>

      <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-ink">
        Page not found
      </h2>

      <p className="mt-3 max-w-md text-base text-ink-3">
        The page you’re looking for doesn’t exist or has been moved. Let’s
        get you back on track.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800"
        >
          ← Back to home
        </Link>

        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-ink shadow transition hover:bg-gray-50"
        >
          Contact us
        </Link>
      </div>
    </motion.div>
  </div>
);

export default NotFound;
