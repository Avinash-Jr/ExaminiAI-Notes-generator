import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiCheckCircle, FiAlertCircle, FiShield, FiCreditCard, FiSmartphone } from "react-icons/fi";

import Button from "../components/ui/Button.jsx";
import Container from "../components/ui/Container.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { Field, Input, Select } from "../components/ui/Field.jsx";
import { setUserData } from "../redux/userSlice.js";
import { serverUrl } from "../App.jsx";

const PACKS = {
  starter:  { id: "starter",  name: "Starter",  credits: 120, price: 199, label: "Starter — 120 credits" },
  popular:  { id: "popular",  name: "Popular",  credits: 300, price: 399, label: "Popular — 300 credits" },
  pro:      { id: "pro",      name: "Pro",      credits: 650, price: 699, label: "Pro — 650 credits" },
};

/* ------------------------------------------------------------------ */
/*  Load Razorpay checkout.js once                                     */
/* ------------------------------------------------------------------ */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) return resolve(true);
    const s = document.createElement("script");
    s.id = "razorpay-checkout-js";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((s) => s.user);

  const initialPack = PACKS[searchParams.get("pack")] ? searchParams.get("pack") : "popular";
  const [packId, setPackId] = useState(initialPack);
  const pack = PACKS[packId];

  const [paymentMode, setPaymentMode] = useState(null); // "razorpay" | "mock" | null (loading)
  const [razorpayKey, setRazorpayKey] = useState(null);

  // Mock-only form state
  const [method, setMethod] = useState("card");
  const [values, setValues] = useState({
    name: "", email: userData?.email || "", card: "", expiry: "", cvc: "", upi: "", paypalEmail: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ kind: "idle", message: "" });
  const [receipt, setReceipt] = useState(null);

  /* Fetch payment config on mount */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${serverUrl}/api/payment/config`);
        const data = await res.json();
        setPaymentMode(data.mode || "mock");
        if (data.mode === "razorpay" && data.key) {
          setRazorpayKey(data.key);
          await loadRazorpayScript();
        }
      } catch {
        setPaymentMode("mock");
      }
    })();
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Razorpay flow                                                    */
  /* ---------------------------------------------------------------- */
  const handleRazorpayPay = async () => {
    if (!userData) {
      setStatus({ kind: "error", message: "Sign in first — credits belong to an account." });
      return;
    }
    setStatus({ kind: "loading", message: "Creating order…" });

    try {
      // 1. Create order on our backend
      const orderRes = await fetch(`${serverUrl}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pack: packId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Could not create order.");

      // 2. Open Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "ExaminAI",
        description: `${pack.name} — ${pack.credits} credits`,
        order_id: orderData.orderId,
        prefill: {
          name: userData.name || "",
          email: userData.email || "",
        },
        theme: { color: "#d97706" }, // amber-600
        handler: async function (response) {
          // 3. Verify payment on backend
          setStatus({ kind: "loading", message: "Verifying payment…" });
          try {
            const verifyRes = await fetch(`${serverUrl}/api/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                mode: "razorpay",
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                pack: packId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed.");

            if (typeof verifyData.creditBalance === "number") {
              dispatch(setUserData({ ...userData, credits: verifyData.creditBalance }));
            }
            setReceipt({
              id: verifyData.receiptId || verifyData.receipt?.id,
              pack: pack.name,
              credits: pack.credits,
              amount: verifyData.amount ?? pack.price,
              method: "Razorpay",
              paymentId: response.razorpay_payment_id,
              at: new Date().toISOString(),
              email: userData.email,
            });
            setStatus({ kind: "success", message: verifyData.message || "Payment confirmed!" });
          } catch (err) {
            setStatus({ kind: "error", message: err.message });
          }
        },
        modal: {
          ondismiss: () => setStatus({ kind: "idle", message: "" }),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setStatus({ kind: "error", message: resp.error?.description || "Payment failed. You were not charged." });
      });
      rzp.open();
      setStatus({ kind: "idle", message: "" });
    } catch (err) {
      setStatus({ kind: "error", message: err.message || "Could not initiate payment." });
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Mock flow (no Razorpay keys)                                     */
  /* ---------------------------------------------------------------- */
  const fieldError = (key) => errors[key] || undefined;

  function luhnValid(number) {
    const s = number.replace(/\s+/g, "");
    if (!/^\d{13,19}$/.test(s)) return false;
    let sum = 0; let dbl = false;
    for (let i = s.length - 1; i >= 0; i--) {
      let d = Number(s[i]);
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return sum % 10 === 0;
  }

  function formatCard(n) {
    return n.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
  }

  function expiryValid(value) {
    const m = value.trim().match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (!m) return false;
    const mm = Number(m[1]); const yy = Number(m[2]);
    if (mm < 1 || mm > 12) return false;
    const full = 2000 + yy;
    const now = new Date();
    const exp = new Date(full, mm, 0, 23, 59, 59);
    return exp >= new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const validateMock = () => {
    const e = {};
    if (!values.name.trim()) e.name = "Name is required.";
    if (!values.email.trim()) e.email = "Billing email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) e.email = "Enter a valid email.";
    if (method === "card") {
      if (!values.card.trim()) e.card = "Card number is required.";
      else if (!luhnValid(values.card)) e.card = "Invalid card. Try 4242 4242 4242 4242.";
      if (!values.expiry.trim()) e.expiry = "Expiry is required.";
      else if (!expiryValid(values.expiry)) e.expiry = "Invalid or past expiry. Use MM / YY.";
      if (!values.cvc.trim()) e.cvc = "CVC is required.";
      else if (!/^\d{3,4}$/.test(values.cvc.trim())) e.cvc = "CVC must be 3–4 digits.";
    } else if (method === "upi") {
      if (!values.upi.trim()) e.upi = "UPI ID is required.";
      else if (!/^[\w.-]+@[\w-]+$/.test(values.upi.trim())) e.upi = "UPI ID format: name@bank";
    } else if (method === "paypal") {
      if (!values.paypalEmail.trim()) e.paypalEmail = "PayPal email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.paypalEmail.trim())) e.paypalEmail = "Invalid email.";
    }
    return e;
  };

  const handleMockPay = async (event) => {
    event.preventDefault();
    if (!userData) {
      setStatus({ kind: "error", message: "Sign in first — credits belong to an account." });
      return;
    }
    const problems = validateMock();
    setErrors(problems);
    if (Object.keys(problems).length > 0) {
      setStatus({ kind: "error", message: `${Object.keys(problems).length} field(s) need attention.` });
      return;
    }
    setStatus({ kind: "loading", message: "Processing mock payment…" });

    try {
      // Create mock order
      const orderRes = await fetch(`${serverUrl}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pack: packId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Could not create order.");

      // Verify mock payment
      const verifyRes = await fetch(`${serverUrl}/api/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode: "mock", orderId: orderData.orderId, pack: packId }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Payment failed.");

      if (typeof verifyData.creditBalance === "number") {
        dispatch(setUserData({ ...userData, credits: verifyData.creditBalance }));
      }
      setReceipt({
        id: verifyData.receiptId || verifyData.receipt?.id || `rcpt_${Date.now()}`,
        pack: pack.name,
        credits: pack.credits,
        amount: verifyData.amount ?? pack.price,
        method: method === "card" ? `Card ••${values.card.replace(/\D/g, "").slice(-4)}` : method === "upi" ? `UPI ${values.upi}` : `PayPal ${values.paypalEmail}`,
        at: new Date().toISOString(),
        email: values.email.trim(),
      });
      setStatus({ kind: "success", message: verifyData.message || "Payment succeeded!" });
    } catch (err) {
      setStatus({ kind: "error", message: err.message || "Payment failed. You were not charged." });
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Receipt screen                                                   */
  /* ---------------------------------------------------------------- */
  if (receipt) {
    return (
      <Container className="py-14 sm:py-20">
        <Panel surface="panel" className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3">
            <FiCheckCircle aria-hidden="true" className="size-8 text-amber-300" />
            <h1 className="text-2xl font-bold text-white">Payment confirmed</h1>
          </div>
          <p className="mt-3 text-white/70">Credits are already on your account.</p>

          <dl className="mt-8 grid gap-4 rounded-xl bg-white/5 p-5 text-sm">
            <ReceiptRow label="Receipt" value={receipt.id} numeric />
            <ReceiptRow label="Pack" value={`${receipt.pack} — ${receipt.credits} credits`} />
            <ReceiptRow label="Amount" value={`₹${receipt.amount}`} numeric />
            <ReceiptRow label="Method" value={receipt.method} />
            {receipt.paymentId ? <ReceiptRow label="Payment ID" value={receipt.paymentId} numeric /> : null}
            <ReceiptRow label="Billed to" value={receipt.email} />
            <ReceiptRow label="Date" value={new Date(receipt.at).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })} />
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button as={Link} to="/settings" variant="accent">View balance</Button>
            <Button as={Link} to="/notes" variant="outline" className="!border-white/20 !text-white hover:!bg-white/10">Generate notes</Button>
          </div>

          {paymentMode === "mock" && (
            <p className="mt-4 text-xs text-white/50">Mock payment — no real charge was made. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env for real payments.</p>
          )}
        </Panel>
      </Container>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Loading state while config fetches                               */
  /* ---------------------------------------------------------------- */
  if (paymentMode === null) {
    return (
      <Container className="py-14 sm:py-20">
        <div className="text-center text-ink-2">Loading payment options…</div>
      </Container>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <Container className="py-14 sm:py-20">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-3 hover:text-ink">
        <FiArrowLeft aria-hidden="true" /> Back
      </button>

      <PageHeader
        title="Pay for credits"
        standfirst={paymentMode === "razorpay"
          ? "Secure checkout powered by Razorpay. Credits are added instantly after payment."
          : "Mock checkout — no real charge. Add Razorpay keys to .env for live payments."
        }
        meta={[{ label: "Mode", value: paymentMode === "razorpay" ? "Live (Razorpay)" : "Mock (preview)" }]}
      />

      {!userData ? (
        <Panel surface="tint" padding="snug" className="mt-8">
          <p className="text-sm text-ink-2">
            You are not signed in. <Link to="/auth" className="font-semibold text-brand underline decoration-1 underline-offset-4 hover:text-brand-deep">Sign in with Google</Link> first, then return here.
          </p>
        </Panel>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] lg:items-start">
        <Panel>
          <h2 className="text-xl font-bold tracking-tight text-ink">Choose your pack</h2>

          <div className="mt-6">
            <Field id="pack-select" label="Credit pack">
              {(field) => (
                <Select {...field} value={packId} onChange={(e) => setPackId(e.target.value)}>
                  {Object.values(PACKS).map((p) => (
                    <option key={p.id} value={p.id}>{p.label} — ₹{p.price}</option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          {/* Razorpay mode: single button opens their checkout */}
          {paymentMode === "razorpay" ? (
            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-2 rounded-chip bg-brand-tint px-4 py-3 text-sm text-ink-2">
                <FiShield aria-hidden="true" className="shrink-0 text-brand" />
                <span>Payment is processed securely by Razorpay. We never see your card details.</span>
              </div>

              {status.kind === "error" ? (
                <p role="alert" className="flex gap-2 rounded-chip border border-brand/30 bg-brand-tint px-4 py-3 text-sm font-medium text-brand">
                  <FiAlertCircle aria-hidden="true" className="mt-0.5 shrink-0" /> <span>{status.message}</span>
                </p>
              ) : null}

              <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="accent"
                  disabled={status.kind === "loading" || !userData}
                  onClick={handleRazorpayPay}
                >
                  {status.kind === "loading" ? "Processing…" : `Pay ₹${pack.price}`}
                </Button>
                <span className="text-fine text-ink-3">
                  About {Math.floor(pack.credits / 7)} sets of notes · ₹{(pack.price / pack.credits).toFixed(2)}/credit
                </span>
              </div>
            </div>
          ) : (
            /* Mock mode: full billing form */
            <>
              <div className="mt-8">
                <p className="text-sm font-semibold text-ink">Payment method</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MethodButton active={method === "card"} onClick={() => setMethod("card")} icon={<FiCreditCard aria-hidden="true" />} label="Card" />
                  <MethodButton active={method === "upi"} onClick={() => setMethod("upi")} icon={<FiSmartphone aria-hidden="true" />} label="UPI" />
                  <MethodButton active={method === "paypal"} onClick={() => setMethod("paypal")} icon={<span aria-hidden="true">$</span>} label="PayPal" />
                </div>
              </div>

              <form onSubmit={handleMockPay} noValidate className="mt-8 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field id="pay-name" label="Name" error={fieldError("name")}>
                    {(field) => <Input {...field} value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} placeholder="Aarav Sharma" autoComplete="name" />}
                  </Field>
                  <Field id="pay-email" label="Billing email" error={fieldError("email")}>
                    {(field) => <Input {...field} value={values.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} placeholder="you@example.com" type="email" autoComplete="email" />}
                  </Field>
                </div>

                {method === "card" ? (
                  <>
                    <Field id="pay-card" label="Card number" error={fieldError("card")} hint="Test: 4242 4242 4242 4242">
                      {(field) => <Input {...field} value={values.card} onChange={(e) => setValues((v) => ({ ...v, card: formatCard(e.target.value) }))} placeholder="4242 4242 4242 4242" inputMode="numeric" autoComplete="cc-number" />}
                    </Field>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field id="pay-expiry" label="Expiry (MM / YY)" error={fieldError("expiry")}>
                        {(field) => <Input {...field} value={values.expiry} onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                          if (v.length > 2) v = `${v.slice(0, 2)} / ${v.slice(2)}`;
                          setValues((prev) => ({ ...prev, expiry: v }));
                        }} placeholder="12 / 28" inputMode="numeric" autoComplete="cc-exp" />}
                      </Field>
                      <Field id="pay-cvc" label="CVC" error={fieldError("cvc")}>
                        {(field) => <Input {...field} value={values.cvc} onChange={(e) => setValues((v) => ({ ...v, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))} placeholder="123" inputMode="numeric" autoComplete="cc-csc" />}
                      </Field>
                    </div>
                  </>
                ) : null}

                {method === "upi" ? (
                  <Field id="pay-upi" label="UPI ID" error={fieldError("upi")} hint="Example: name@okaxis">
                    {(field) => <Input {...field} value={values.upi} onChange={(e) => setValues((v) => ({ ...v, upi: e.target.value }))} placeholder="aarav@okaxis" autoComplete="off" />}
                  </Field>
                ) : null}

                {method === "paypal" ? (
                  <Field id="pay-paypal" label="PayPal email" error={fieldError("paypalEmail")}>
                    {(field) => <Input {...field} value={values.paypalEmail} onChange={(e) => setValues((v) => ({ ...v, paypalEmail: e.target.value }))} placeholder="you@paypal.example.com" type="email" />}
                  </Field>
                ) : null}

                <div className="flex items-center gap-2 rounded-chip bg-brand-tint px-4 py-3 text-sm text-ink-2">
                  <FiShield aria-hidden="true" className="shrink-0 text-brand" />
                  <span>Mock mode — no real charge. Add RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET to your server .env for live payments.</span>
                </div>

                {status.kind === "error" ? (
                  <p role="alert" className="flex gap-2 rounded-chip border border-brand/30 bg-brand-tint px-4 py-3 text-sm font-medium text-brand">
                    <FiAlertCircle aria-hidden="true" className="mt-0.5 shrink-0" /> <span>{status.message}</span>
                  </p>
                ) : null}

                <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" variant="accent" disabled={status.kind === "loading"}>
                    {status.kind === "loading" ? "Processing…" : `Pay ₹${pack.price} — mock`}
                  </Button>
                  <span className="text-fine text-ink-3">
                    About {Math.floor(pack.credits / 7)} sets of notes · ₹{(pack.price / pack.credits).toFixed(2)}/credit
                  </span>
                </div>
              </form>
            </>
          )}

          <p className="mt-6 text-xs text-ink-3">
            By paying you accept the <Link to="/terms" className="underline decoration-1 underline-offset-4 hover:text-brand">terms</Link>. No subscription — one-time pack.
          </p>
        </Panel>

        <aside className="space-y-5">
          <Panel padding="snug">
            <h2 className="font-semibold text-ink">Order summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <SummaryRow label={pack.label} value={`₹${pack.price}`} />
              <SummaryRow label="Credits added" value={`${pack.credits} credits`} />
              <SummaryRow label="Payment" value={paymentMode === "razorpay" ? "Razorpay (UPI/Card/Wallet)" : method === "card" ? "Card" : method === "upi" ? "UPI" : "PayPal"} />
            </dl>
            <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm font-semibold">
              <span>Total</span><span data-numeric>₹{pack.price}</span>
            </div>
          </Panel>

          <Panel surface="tint" padding="snug">
            <h2 className="font-semibold text-ink">{paymentMode === "razorpay" ? "Razorpay secure checkout" : "How to enable Razorpay"}</h2>
            {paymentMode === "razorpay" ? (
              <ul className="mt-3 space-y-2 text-sm text-ink-2">
                <li>• Supports UPI, all major cards, wallets, and net banking</li>
                <li>• Your card details are handled entirely by Razorpay</li>
                <li>• A receipt is generated for every successful payment</li>
              </ul>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-ink-2">
                <li>• Create a <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">Razorpay account</a></li>
                <li>• Add <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">RAZORPAY_KEY_ID</code> and <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">RAZORPAY_KEY_SECRET</code> to your server .env</li>
                <li>• Run <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">npm i razorpay</code> in /server</li>
                <li>• Restart the server — payment switches to live automatically</li>
              </ul>
            )}
            <Link to="/pricing" className="mt-4 inline-block text-sm font-semibold text-brand underline decoration-1 underline-offset-4 hover:text-brand-deep">
              Compare packs →
            </Link>
          </Panel>
        </aside>
      </div>
    </Container>
  );
}

function MethodButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "flex items-center justify-center gap-2 rounded-chip border border-brand bg-brand-tint px-3 py-3 text-sm font-semibold text-ink"
          : "flex items-center justify-center gap-2 rounded-chip border border-line-firm bg-sheet px-3 py-3 text-sm font-semibold text-ink-2 hover:border-ink-3"
      }
    >
      {icon} {label}
    </button>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ink-3">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

function ReceiptRow({ label, value, numeric }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="text-white/50">{label}</dt>
      <dd className="font-medium text-white" {...(numeric ? { "data-numeric": "" } : {})}>{value}</dd>
    </div>
  );
}
