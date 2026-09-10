import Navbar from "../components/Navbar.jsx";
import { motion } from "motion/react";
import { useState } from "react";
import heroVideo from "../assets/navbar-video.mp4";
import Footer from "../components/Footer.jsx";
import GenerateNotesDialog from "../components/GenerateNotesDialog.jsx";

const features = [
  {
    icon: "🎁",
    title: "100 Free Credits",
    description:
      "Start instantly with 100 free credits and experience powerful AI note generation without paying.",
  },
  {
    icon: "🎯",
    title: "Exam-Ready Notes",
    description:
      "Generate high-yield, revision-friendly notes focused on the concepts that matter most.",
  },
  {
    icon: "🚀",
    title: "Project Documentation",
    description:
      "Create clean and professional documentation for assignments, projects, and submissions in seconds.",
  },
  {
    icon: "⚡",
    title: "AI-Powered Learning",
    description:
      "Turn lengthy study material into clear, structured, and easy-to-understand notes with AI.",
  },
];

export const Home = () => {
  /* "Get Started" opens the brief; the topic form is the screen after it. */
  const [briefOpen, setBriefOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-white text-black">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <main>
        <section className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-[-120px] top-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
            <div className="absolute bottom-0 right-[-120px] h-96 w-96 rounded-full bg-purple-200/20 blur-3xl" />
          </div>

          <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl grid-cols-1 items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
            {/* LEFT CONTENT */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-sm font-medium text-gray-700 backdrop-blur"
              >
                <span className="h-2 w-2 rounded-full bg-green-500" />
                AI-powered exam preparation
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
              >
                Study smarter.
                <br />
                <span className="bg-gradient-to-r from-black via-gray-600 to-black bg-clip-text text-transparent">
                  Revise faster.
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.7 }}
                className="mt-6 max-w-xl text-base leading-8 text-gray-600 sm:text-lg"
              >
                ExaminAI transforms your study material into exam-focused
                notes, summaries, diagrams, and revision resources using AI.
                Spend less time organizing and more time learning.
              </motion.p>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="mt-9 flex flex-wrap items-center gap-4"
              >
                <motion.button
                  type="button"
                  onClick={() => setBriefOpen(true)}
                  whileHover={{
                    y: -4,
                    scale: 1.03,
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 18,
                  }}
                  className="rounded-xl bg-black px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-black/20 transition hover:bg-gray-900"
                >
                  Get Started
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  whileHover={{ y: -3 }}
                  className="rounded-xl border border-black/10 bg-white px-7 py-3.5 text-base font-semibold text-gray-800 shadow-sm transition hover:border-black/20 hover:shadow-md"
                >
                  Explore Features
                </motion.button>
              </motion.div>

              {/* Trust text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.7 }}
                className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500"
              >
                <span>✓ AI-generated notes</span>
                <span>✓ Exam-focused</span>
                <span>✓ Fast & simple</span>
              </motion.div>
            </motion.div>

            {/* RIGHT VIDEO */}
            <motion.div
              initial={{
                opacity: 0,
                x: 70,
                rotateY: -16,
                rotateX: 8,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                x: 0,
                rotateY: 0,
                rotateX: 0,
                scale: 1,
              }}
              transition={{
                duration: 1.1,
                ease: "easeOut",
              }}
              className="relative flex justify-center lg:justify-end"
              style={{
                perspective: "1400px",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.25, 0.4, 0.25],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute h-[70%] w-[80%] rounded-full bg-blue-400/30 blur-[90px]"
              />

              {/* Shadow */}
              <motion.div
                animate={{
                  scaleX: [1, 0.92, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-8 h-10 w-[70%] rounded-full bg-black/30 blur-2xl"
              />

              {/* Video Card */}
              <motion.div
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                whileHover={{
                  rotateY: -7,
                  rotateX: 5,
                  scale: 1.02,
                  y: -10,
                }}
                className="relative w-full max-w-[650px] rounded-[28px] border border-white/50 bg-white/60 p-2 shadow-[0_40px_100px_rgba(0,0,0,0.22)] backdrop-blur-xl"
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Inner video */}
                <div className="relative overflow-hidden rounded-[22px] bg-black">
                  <video
                    src={heroVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="aspect-video w-full object-cover"
                  />

                  {/* Dark overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10" />

                  {/* Shine */}
                  <motion.div
                    animate={{
                      x: ["-120%", "140%"],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatDelay: 2.5,
                      ease: "easeInOut",
                    }}
                    className="pointer-events-none absolute inset-y-0 left-0 w-[30%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />

                  {/* Video border */}
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] border border-white/10" />
                </div>

                {/* Floating indicator */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -right-4 top-8 hidden rounded-2xl border border-white/40 bg-white/80 px-4 py-3 shadow-xl backdrop-blur-md sm:block"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm text-white">
                      AI
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        Smart Notes
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Generated instantly
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="border-t border-black/5 bg-gray-50 px-6 py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mx-auto mb-12 max-w-2xl text-center"
            >
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                Why ExaminAI
              </span>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to study better
              </h2>

              <p className="mt-4 text-gray-600">
                Powerful AI tools designed to make preparation simpler,
                faster, and more effective.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Feature
                  key={feature.title}
                  {...feature}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>
        <Footer />
      </main>

      <GenerateNotesDialog
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
      />
    </div>
  );
};

function Feature ({ icon, title, description, index }) {
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
        {description}
      </p>
    </motion.div>
  );
}
export default Home;
