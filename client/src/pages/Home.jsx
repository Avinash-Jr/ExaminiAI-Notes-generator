import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  FiZap,
  FiFileText,
  FiDownload,
  FiCheckCircle,
  FiArrowRight,
  FiLayers,
  FiShield,
  FiStar,
  FiChevronDown,
  FiAward
} from "react-icons/fi";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import GenerateNotesDialog from "../components/GenerateNotesDialog.jsx";
import heroVideo from "../assets/navbar-video.mp4";

const stats = [
  { value: "50,000+", label: "Study notes synthesized" },
  { value: "98.4%", label: "Exam preparedness confidence" },
  { value: "12x", label: "Faster revision time" },
  { value: "4.9 / 5", label: "Student & scholar rating" },
];

const pillars = [
  {
    icon: FiZap,
    tag: "High-Yield AI",
    title: "Exam-Targeted Summaries",
    desc: "Cut through 80-page textbook chapters in seconds. ExaminAI isolates high-probability test concepts, definitions, and formulas.",
  },
  {
    icon: FiLayers,
    tag: "Visual Architecture",
    title: "Diagrams & Concept Maps",
    desc: "Generate ASCII diagrams, flowcharts, and comparative tables that transform abstract theories into memorable mental models.",
  },
  {
    icon: FiFileText,
    tag: "Flexible Templates",
    title: "Cornell & Revision Cheatsheets",
    desc: "Choose between standard Cornell notes, rapid bullet lists, practice Q&A prompts, or formula-heavy cram sheets.",
  },
  {
    icon: FiDownload,
    tag: "Publication Grade",
    title: "One-Click PDF & LaTeX Export",
    desc: "Download gorgeous, printable PDF study packs complete with page numbers, subject headers, and clean typography.",
  },
];

const steps = [
  {
    step: "01",
    title: "Input Topic or Upload Slides",
    desc: "Type your exam topic, syllabus unit, or drag-and-drop lecture PDFs and course handouts directly into the generator.",
  },
  {
    step: "02",
    title: "AI Synthesis & Structuring",
    desc: "Our tuned AI models extract key principles, organize hierarchical sections, and construct revision memory anchors.",
  },
  {
    step: "03",
    title: "Study, Annotate & Export",
    desc: "Read in an optimal distraction-free layout, adjust font sizes, or export cleanly formatted PDFs for printing or offline tablet review.",
  },
];

const testimonials = [
  {
    quote:
      "ExaminAI saved my finals week. Being able to generate Cornell-style summaries for Organic Chemistry with reaction diagrams cut my study time in half.",
    author: "Elena Rostova",
    role: "Biochemistry Major • Oxford",
    avatar: "ER",
  },
  {
    quote:
      "The revision mode formula sheets are unmatched. The LaTeX-quality equations and key term callouts are vastly better than generic ChatGPT notes.",
    author: "Marcus Vance",
    role: "Electrical Engineering • MIT",
    avatar: "MV",
  },
  {
    quote:
      "As a pre-law student reading hundreds of pages of case law, ExaminAI extracts the holdings and rationales with zero hallucinated fluff.",
    author: "Amina Al-Mansoor",
    role: "Juris Doctor Candidate • Georgetown",
    avatar: "AA",
  },
];

const faqs = [
  {
    q: "How does ExaminAI differ from standard chat AI tools?",
    a: "Unlike generic conversational models that produce rambling text, ExaminAI is specifically engineered for academic retention. It adheres to pedagogical frameworks like the Cornell Method, incorporates markdown diagramming, generates exam prediction questions, and formats directly into print-ready study guides.",
  },
  {
    q: "What do I get with the 100 free credits?",
    a: "New accounts receive 100 free credits immediately upon registration with no credit card required. This is enough to generate complete comprehensive study guides for several chapters or exam units.",
  },
  {
    q: "Can I export notes to PDF and Markdown?",
    a: "Yes! Every note can be exported with one click as an authenticated high-resolution PDF (built with vector typography and clean margins), raw Markdown, LaTeX, or HTML.",
  },
  {
    q: "Are my uploaded notes and study materials private?",
    a: "Absolutely. All generation payloads and notes are strictly private to your authenticated user account. We never share or sell student data.",
  },
];

export const Home = () => {
  const navigate = useNavigate();
  const [briefOpen, setBriefOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-sheet text-ink transition-colors selection:bg-brand selection:text-white">
      {/* Top Marketing Navbar */}
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-10 pb-20 lg:pt-16 lg:pb-32">
          {/* Subtle Ambient Backdrops */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[900px] rounded-full bg-brand/10 blur-[130px]" />
            <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-amber-500/5 blur-[120px]" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* LEFT HERO COPY */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="max-w-2xl"
              >
                {/* Social Proof Pill */}
                <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand-soft px-4 py-1.5 text-xs font-semibold text-brand backdrop-blur-xs mb-6 shadow-xs">
                  <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span>Next-Gen Study Engine</span>
                  <span className="text-ink-3">•</span>
                  <span className="text-ink-2">100 Free Credits to Start</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-display leading-[1.1]">
                  Study smarter. <br />
                  <span className="bg-gradient-to-r from-brand to-amber-500 bg-clip-text text-transparent">
                    Master any exam.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="mt-6 text-base sm:text-lg text-ink-2 leading-relaxed max-w-xl">
                  ExaminAI turns dense syllabus topics and lecture notes into high-yield, structured revision summaries, concept diagrams, and formula sheets in seconds.
                </p>

                {/* CTA Buttons */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setBriefOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-sheet px-7 py-3.5 text-sm font-semibold shadow-card hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <span>Start Generating Free</span>
                    <FiArrowRight className="size-4 text-brand-lit" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/pricing")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-line-firm bg-sheet px-6 py-3.5 text-sm font-semibold text-ink hover:bg-band shadow-xs transition-colors"
                  >
                    <span>View Pricing & Plans</span>
                  </button>
                </div>

                {/* Trust Highlights */}
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-3">
                  <span className="flex items-center gap-1.5">
                    <FiCheckCircle className="text-success" /> No credit card required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiCheckCircle className="text-success" /> Instant PDF download
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiCheckCircle className="text-success" /> Cornell note formats
                  </span>
                </div>
              </motion.div>

              {/* RIGHT 3D VIDEO PREVIEW */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative flex justify-center lg:justify-end"
              >
                {/* Glow ring */}
                <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-brand/30 to-amber-500/20 blur-xl opacity-70" />

                <div className="relative w-full max-w-[620px] rounded-[28px] border border-line-firm/60 bg-surface/80 p-2.5 shadow-float backdrop-blur-xl">
                  <div className="relative overflow-hidden rounded-[20px] bg-black shadow-inner">
                    <video
                      src={heroVideo}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="aspect-video w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                  </div>

                  {/* Floating floating indicator badge */}
                  <div className="absolute -bottom-5 -left-4 hidden sm:flex items-center gap-3 rounded-2xl border border-line bg-sheet px-4 py-3 shadow-card backdrop-blur-md">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white font-bold">
                      <FiZap className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Smart Note Engine</p>
                      <p className="text-[11px] text-ink-3">Cornell • Diagrams • Formulas</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* METRICS STRIP */}
            <div className="mt-16 sm:mt-24 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 border-y border-line py-8">
              {stats.map((s) => (
                <div key={s.label} className="text-center sm:text-left px-2">
                  <p className="text-2xl sm:text-3xl font-extrabold text-ink text-display" data-numeric>
                    {s.value}
                  </p>
                  <p className="text-xs sm:text-sm text-ink-3 mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES / PILLARS SECTION */}
        <section id="features" className="py-20 bg-band border-b border-line">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-brand">
                Built for Academic Excellence
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-ink text-display tracking-tight">
                Engineered for serious study sessions
              </h2>
              <p className="mt-4 text-sm sm:text-base text-ink-2">
                Say goodbye to fragmented notes and disorganized textbooks. ExaminAI creates clean, structured knowledge architectures designed for quick recall.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pillars.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="flex flex-col justify-between rounded-2xl border border-line bg-sheet p-6 shadow-xs hover:border-brand/40 hover:shadow-card transition-all duration-200 group"
                  >
                    <div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand mb-4 group-hover:scale-105 transition-transform">
                        <Icon className="size-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                        {p.tag}
                      </span>
                      <h3 className="mt-1 text-base font-bold text-ink">{p.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-ink-2">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-20 lg:py-28 bg-sheet border-b border-line">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-brand">
                Simple 3-Step Workflow
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-ink text-display tracking-tight">
                From syllabus to mastery in seconds
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {steps.map((st) => (
                <div
                  key={st.step}
                  className="relative flex flex-col rounded-2xl border border-line bg-band p-6 sm:p-8"
                >
                  <span className="text-4xl font-extrabold text-display text-brand/30 mb-4" data-numeric>
                    {st.step}
                  </span>
                  <h3 className="text-lg font-bold text-ink">{st.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-ink-2 leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20 bg-band border-b border-line">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-brand">
                Student Testimonials
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-ink text-display tracking-tight">
                Loved by scholars across disciplines
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.author}
                  className="rounded-2xl border border-line bg-sheet p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-500 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className="size-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-ink-2 leading-relaxed italic">
                      "{t.quote}"
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-3 pt-4 border-t border-line">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white font-bold text-xs">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">{t.author}</p>
                      <p className="text-[11px] text-ink-3">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section className="py-20 bg-sheet border-b border-line">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-brand">FAQ</span>
              <h2 className="mt-2 text-3xl font-extrabold text-ink text-display">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={faq.q}
                  className="rounded-xl border border-line bg-band overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-ink hover:text-brand transition-colors"
                    aria-expanded={openFaq === idx}
                  >
                    <span>{faq.q}</span>
                    <FiChevronDown
                      className={`size-4 shrink-0 transition-transform duration-200 ${
                        openFaq === idx ? "rotate-180 text-brand" : "text-ink-3"
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-ink-2 leading-relaxed border-t border-line/60 pt-3">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="py-20 lg:py-24 bg-band">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-ink text-sheet p-8 sm:p-14 text-center shadow-panel">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/30 blur-3xl" />
              <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 mb-4">
                  <FiAward className="size-3.5" /> Start With 100 Free Credits
                </span>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-display tracking-tight text-white">
                  Ready to ace your upcoming exams?
                </h2>

                <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed">
                  Join thousands of students who have upgraded their revision workflow. Generate your first Cornell study pack in under 30 seconds.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setBriefOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold px-8 py-3.5 text-sm transition-all shadow-md active:scale-95"
                  >
                    <span>Create My First Note</span>
                    <FiArrowRight className="size-4" />
                  </button>

                  <Link
                    to="/pricing"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3.5 text-sm transition-colors"
                  >
                    View Pricing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global Footer */}
        <Footer />
      </main>

      {/* Note Generation Dialog modal */}
      <GenerateNotesDialog
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
      />
    </div>
  );
};

export default Home;
