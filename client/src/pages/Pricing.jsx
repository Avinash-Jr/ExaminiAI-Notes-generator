import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiCheck, FiArrowRight, FiHelpCircle } from "react-icons/fi";

import Button from "../components/ui/Button.jsx";
import Container from "../components/ui/Container.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";

const packs = [
  {
    id: "starter",
    name: "Starter",
    credits: 120,
    price: 199,
    priceLabel: "₹199",
    popular: false,
    bullets: ["120 credits", "About 17 sets of notes", "Revision notes & summaries", "PDF export"],
    href: "/payment?pack=starter",
  },
  {
    id: "popular",
    name: "Popular",
    credits: 300,
    price: 399,
    priceLabel: "₹399",
    popular: true,
    bullets: ["300 credits", "About 42 sets of notes", "Everything in Starter", "Diagrams & visuals included", "Priority generation queue"],
    href: "/payment?pack=popular",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 650,
    price: 699,
    priceLabel: "₹699",
    popular: false,
    bullets: ["650 credits", "About 92 sets of notes", "Everything in Popular", "Best per-credit value", "Sharable team credits (soon)"],
    href: "/payment?pack=pro",
  },
];

const faqs = [
  {
    q: "What does one generation cost?",
    a: "About 7 credits for Balanced notes (the default). Tight costs 5, Thorough costs 10; add 3 more when you include diagrams. Search, reading and re-downloading never cost anything.",
  },
  {
    q: "Do credits expire?",
    a: "Purchased credits do not expire while your account is open. Free starter credits carry the same rule. Closing your account removes remaining credits.",
  },
  {
    q: "What if generation fails?",
    a: "A failed generation returns its credits automatically so you can retry. The history page shows exactly what was charged on each attempt.",
  },
  {
    q: "How does the payment work?",
    a: "Cards (Visa/Mastercard/RuPay) and UPI are accepted. Payment is simulated in this preview build — no real money is charged — and credits are added instantly. Production will use Razorpay/Stripe.",
  },
  {
    q: "Can I get a refund?",
    a: "Unused purchased credits are refundable within 7 days of purchase. Spent credits are not. Contact support@examinai.app for help.",
  },
];

export default function Pricing() {
  const { userData } = useSelector((s) => s.user);
  const navigate = useNavigate();

  return (
    <Container className="py-14 sm:py-20">
      <PageHeader
        title="Pricing"
        standfirst="Credits buy generations. Reading, searching and downloading what you already have is always free."
        meta={[
          { label: "Free to start", value: "100 credits" },
          { label: "Each set", value: "from 5 credits" },
        ]}
        actions={
          userData ? (
            <Button variant="outline" onClick={() => navigate("/settings")}>
              Your balance: {userData.credits ?? 0} credits
            </Button>
          ) : (
            <Button as={Link} to="/auth" variant="outline">
              Sign in to buy
            </Button>
          )
        }
      />

      <div className="mt-10 grid gap-6 sm:gap-5 md:grid-cols-3">
        {packs.map((pack) => (
          <Panel
            key={pack.id}
            surface={pack.popular ? "panel" : "sheet"}
            padding="roomy"
            className={
              pack.popular
                ? "relative -translate-y-1 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                : ""
            }
          >
            {pack.popular ? (
              <span className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white shadow">
                Most chosen
              </span>
            ) : null}

            <p className={pack.popular ? "text-sm font-semibold text-amber-200" : "text-sm font-semibold text-brand"}>
              {pack.name}
            </p>

            <p className={pack.popular ? "mt-2 text-4xl font-extrabold tracking-tight text-white" : "mt-2 text-4xl font-extrabold tracking-tight text-ink"}>
              {pack.priceLabel}
              <span className={pack.popular ? "ml-2 text-sm font-normal text-white/70" : "ml-2 text-sm font-normal text-ink-3"}>
                one-time
              </span>
            </p>

            <p className={pack.popular ? "mt-2 text-sm text-white/60" : "mt-2 text-sm text-ink-3"}>
              {pack.credits} credits — roughly {Math.floor(pack.credits / 7)} sets of notes
            </p>

            <ul className="mt-6 space-y-2.5">
              {pack.bullets.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm">
                  <FiCheck aria-hidden="true" className={pack.popular ? "mt-0.5 shrink-0 text-amber-300" : "mt-0.5 shrink-0 text-brand"} />
                  <span className={pack.popular ? "text-white/90" : "text-ink-2"}>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button as={Link} to={pack.href} variant={pack.popular ? "accent" : "solid"} className="w-full justify-center">
                Buy {pack.name} <FiArrowRight aria-hidden="true" />
              </Button>
            </div>

            <p className={pack.popular ? "mt-3 text-center text-xs text-white/50" : "mt-3 text-center text-xs text-ink-3"}>
              Mock payment — no real charge in preview
            </p>
          </Panel>
        ))}
      </div>

      <Panel surface="tint" padding="snug" className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-2">
          Included with every pack: unlimited reading, searching, PDF downloads and history.
        </p>
        <Link to="/about" className="text-sm font-semibold text-brand underline decoration-1 underline-offset-4 hover:text-brand-deep">
          How ExaminAI works →
        </Link>
      </Panel>

      <section aria-labelledby="faq-heading" className="mt-16">
        <h2 id="faq-heading" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          <FiHelpCircle aria-hidden="true" className="text-brand" /> Questions
        </h2>
        <div className="mt-6 divide-y divide-line rounded-panel border border-line bg-sheet">
          {faqs.map((item) => (
            <div key={item.q} className="p-6 sm:p-7">
              <h3 className="font-semibold text-ink">{item.q}</h3>
              <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-ink-2">{item.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-ink-3">
          Still deciding? Read the <Link to="/terms" className="font-semibold text-brand underline decoration-1 underline-offset-4 hover:text-brand-deep">terms</Link> on credits first.
        </p>
      </section>
    </Container>
  );
}
