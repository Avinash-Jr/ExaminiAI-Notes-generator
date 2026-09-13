import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiCheck, FiArrowRight, FiZap, FiAward, FiShield } from "react-icons/fi";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const creditPacks = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 120,
    price: 199,
    priceLabel: "₹199",
    tagline: "Perfect for single subject exam prep",
    popular: false,
    bullets: [
      "120 AI Note Credits",
      "~18 full chapter study sets",
      "Cornell note generation",
      "Instant PDF & text export",
      "Never expires",
    ],
    href: "/payment?pack=starter",
  },
  {
    id: "popular",
    name: "Scholar Pro",
    credits: 350,
    price: 399,
    priceLabel: "₹399",
    tagline: "Most popular for semester finals",
    popular: true,
    bullets: [
      "350 AI Note Credits",
      "~50 complete chapter study packs",
      "ASCII & Flowchart diagrams included",
      "Formula & cheat sheet generation",
      "Priority AI queue (2x faster)",
      "Never expires",
    ],
    href: "/payment?pack=popular",
  },
  {
    id: "pro",
    name: "Campus Bulk",
    credits: 800,
    price: 749,
    priceLabel: "₹749",
    tagline: "Best value for competitive exams",
    popular: false,
    bullets: [
      "800 AI Note Credits",
      "~120 deep-dive study packs",
      "Everything in Scholar Pro",
      "LaTeX math equations support",
      "Highest per-credit savings (55% off)",
      "Sharable team pool access",
    ],
    href: "/payment?pack=pro",
  },
];

const subscriptions = [
  {
    id: "monthly_free",
    name: "Free Tier",
    priceLabel: "₹0",
    period: "/month",
    tagline: "Start learning with zero commitment",
    popular: false,
    bullets: [
      "100 initial free credits",
      "Standard balanced note format",
      "Web reading & PDF downloads",
      "Community support",
    ],
    ctaText: "Current Plan",
    href: "/topic-form",
  },
  {
    id: "monthly_pro",
    name: "Unlimited Pro",
    priceLabel: "₹499",
    period: "/month",
    tagline: "For students with weekly exams",
    popular: true,
    bullets: [
      "1,000 monthly credits refreshed automatically",
      "Unlimited Cornell & cram note generation",
      "All visual diagrams & formula sheets",
      "High-speed generation priority",
      "Roll-over unused credits",
    ],
    ctaText: "Upgrade to Pro",
    href: "/payment?pack=popular",
  },
  {
    id: "annual_pro",
    name: "Annual Scholar",
    priceLabel: "₹3,999",
    period: "/year",
    savings: "Save 33%",
    tagline: "The complete academic year companion",
    popular: false,
    bullets: [
      "15,000 credits allocated instantly",
      "Everything in Unlimited Pro",
      "Team / Study Group workspace sharing (up to 3 peers)",
      "Custom exam syllabus tailoring",
      "VIP customer support",
    ],
    ctaText: "Subscribe Annually",
    href: "/payment?pack=pro",
  },
];

const faqs = [
  {
    q: "How are credits consumed during generation?",
    a: "Standard balanced notes cost 7 credits. Concise revision cram sheets cost 5 credits, and exhaustive comprehensive guides cost 10 credits. Adding ASCII diagrams adds 3 credits.",
  },
  {
    q: "Do purchased credits expire?",
    a: "No. Purchased credit packs have no expiration date as long as your account remains open. You can use them across multiple semesters at your own pace.",
  },
  {
    q: "What payment methods are supported?",
    a: "We support UPI (Google Pay, PhonePe, Paytm), credit and debit cards (Visa, Mastercard, RuPay), and net banking through secure payment gateway integration.",
  },
  {
    q: "Can I get a refund if I'm not satisfied?",
    a: "We offer a 7-day money-back guarantee on unused purchased credits. If you haven't used your pack, reach out to our team for a prompt refund.",
  },
];

export default function Pricing() {
  const { userData } = useSelector((s) => s.user);
  const navigate = useNavigate();
  const [tab, setTab] = useState("packs"); // 'packs' or 'sub'

  return (
    <div className="min-h-screen bg-sheet text-ink transition-colors">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* Header Title & Pitch */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft border border-brand/20 px-3.5 py-1 text-xs font-semibold text-brand">
            <FiAward className="size-3.5" /> Transparent Academic Pricing
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-display tracking-tight text-ink">
            Pay only for the notes you need.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-ink-2">
            No sneaky hidden fees. Reading, searching, and re-downloading previously generated notes is always 100% free.
          </p>

          {/* Current balance indicator for logged-in users */}
          {userData && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line bg-band px-4 py-2 text-xs font-semibold">
              <span className="text-ink-3">Current Account Balance:</span>
              <span className="text-brand font-bold" data-numeric>{userData.credits ?? 0} Credits</span>
              <span className="text-ink-3">•</span>
              <Link to="/history" className="text-ink hover:underline">
                View Usage Log →
              </Link>
            </div>
          )}

          {/* Model Switcher Pill */}
          <div className="mt-10 inline-flex items-center rounded-2xl border border-line bg-band p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setTab("packs")}
              className={`rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
                tab === "packs"
                  ? "bg-sheet text-ink shadow-xs"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              Credit Packs (Pay-As-You-Go)
            </button>
            <button
              type="button"
              onClick={() => setTab("sub")}
              className={`rounded-xl px-5 py-2.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                tab === "sub"
                  ? "bg-sheet text-ink shadow-xs"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              <span>Monthly Plans</span>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-1.5 py-0.2 text-[10px]">
                Save 30%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {tab === "packs"
            ? creditPacks.map((pack) => (
                <div
                  key={pack.id}
                  className={`flex flex-col justify-between rounded-3xl p-8 transition-all relative ${
                    pack.popular
                      ? "bg-ink text-sheet border-2 border-brand shadow-panel md:-translate-y-2"
                      : "bg-surface border border-line shadow-card text-ink"
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-sm">
                      Most Popular Pack
                    </div>
                  )}

                  <div>
                    <h3 className={`text-xl font-bold ${pack.popular ? "text-white" : "text-ink"}`}>
                      {pack.name}
                    </h3>
                    <p className={`text-xs mt-1 ${pack.popular ? "text-gray-300" : "text-ink-3"}`}>
                      {pack.tagline}
                    </p>

                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-display" data-numeric>
                        {pack.priceLabel}
                      </span>
                      <span className={`text-xs font-medium ${pack.popular ? "text-gray-400" : "text-ink-3"}`}>
                        one-time
                      </span>
                    </div>

                    <div className="my-6 border-t border-line/40" />

                    <ul className="space-y-3">
                      {pack.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-xs">
                          <FiCheck className={`size-4 shrink-0 mt-0.5 ${pack.popular ? "text-amber-400" : "text-brand"}`} />
                          <span className={pack.popular ? "text-gray-200" : "text-ink-2"}>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-line/30">
                    <button
                      type="button"
                      onClick={() => navigate(pack.href)}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                        pack.popular
                          ? "bg-brand hover:bg-brand-deep text-white shadow-md active:scale-[0.98]"
                          : "bg-ink hover:opacity-90 text-sheet active:scale-[0.98]"
                      }`}
                    >
                      <span>Buy {pack.credits} Credits</span>
                      <FiArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              ))
            : subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className={`flex flex-col justify-between rounded-3xl p-8 transition-all relative ${
                    sub.popular
                      ? "bg-ink text-sheet border-2 border-brand shadow-panel md:-translate-y-2"
                      : "bg-surface border border-line shadow-card text-ink"
                  }`}
                >
                  {sub.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-sm">
                      Best Academic Value
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-xl font-bold ${sub.popular ? "text-white" : "text-ink"}`}>
                        {sub.name}
                      </h3>
                      {sub.savings && (
                        <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                          {sub.savings}
                        </span>
                      )}
                    </div>

                    <p className={`text-xs mt-1 ${sub.popular ? "text-gray-300" : "text-ink-3"}`}>
                      {sub.tagline}
                    </p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-display" data-numeric>
                        {sub.priceLabel}
                      </span>
                      <span className={`text-xs font-medium ${sub.popular ? "text-gray-400" : "text-ink-3"}`}>
                        {sub.period}
                      </span>
                    </div>

                    <div className="my-6 border-t border-line/40" />

                    <ul className="space-y-3">
                      {sub.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-xs">
                          <FiCheck className={`size-4 shrink-0 mt-0.5 ${sub.popular ? "text-amber-400" : "text-brand"}`} />
                          <span className={sub.popular ? "text-gray-200" : "text-ink-2"}>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-line/30">
                    <button
                      type="button"
                      onClick={() => navigate(sub.href)}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                        sub.popular
                          ? "bg-brand hover:bg-brand-deep text-white shadow-md active:scale-[0.98]"
                          : "bg-ink hover:opacity-90 text-sheet active:scale-[0.98]"
                      }`}
                    >
                      <span>{sub.ctaText}</span>
                      <FiArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
        </div>

        {/* Security & Guarantee Guarantee Strip */}
        <div className="mt-16 rounded-2xl border border-line bg-band p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-3">
          <div className="flex items-center gap-2">
            <FiShield className="size-4 text-emerald-500" />
            <span>256-Bit SSL Encrypted Checkout via Razorpay / Stripe</span>
          </div>
          <div className="flex items-center gap-2">
            <FiZap className="size-4 text-amber-500" />
            <span>Credits loaded to your account instantly</span>
          </div>
          <div className="flex items-center gap-2">
            <FiAward className="size-4 text-brand" />
            <span>7-day refund guarantee for unused credits</span>
          </div>
        </div>

        {/* Pricing FAQs */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-ink text-display mb-8">
            Frequently Asked Pricing Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
                <h3 className="text-sm font-bold text-ink">{faq.q}</h3>
                <p className="mt-2 text-xs sm:text-sm text-ink-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
