import UserModel from "../models/user.models.js";
import crypto from "crypto";
import { logActivity } from "../utils/logActivity.js";

const IS_PROD = process.env.NODE_ENV === "production";

const PACKS = {
  starter: { credits: 120, price: 199 },
  popular: { credits: 300, price: 399 },
  pro: { credits: 650, price: 699 },
};

// In-memory receipt store (use a real DB collection in production).
const receipts = new Map();

// Payment/order ids already credited — blocks replay of an otherwise-valid
// payment. NOTE: in-memory only, so a restart or a second instance loses it.
// Before scaling out, move this to a unique index on a payments collection.
const consumedPayments = new Set();

function receiptId() {
  return `rcpt_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`;
}

/* ------------------------------------------------------------------ */
/*  Razorpay helpers — only initialised when env keys are present      */
/* ------------------------------------------------------------------ */
let razorpayInstance = null;

async function getRazorpay() {
  if (razorpayInstance) return razorpayInstance;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  try {
    const Razorpay = (await import("razorpay")).default;
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    return razorpayInstance;
  } catch {
    console.warn("razorpay package not installed — falling back to mock payments.");
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/payment/config                                            */
/*  Returns the Razorpay key_id (public) so the client can load the   */
/*  checkout. If Razorpay is not configured, returns mode: "mock".     */
/* ------------------------------------------------------------------ */
export const getPaymentConfig = async (_req, res) => {
  const rz = await getRazorpay();
  if (rz) {
    return res.json({ mode: "razorpay", key: process.env.RAZORPAY_KEY_ID });
  }
  return res.json({ mode: "mock" });
};

/* ------------------------------------------------------------------ */
/*  POST /api/payment/create-order                                     */
/*  Creates a Razorpay order (or a mock order if Razorpay is absent). */
/* ------------------------------------------------------------------ */
export const createOrder = async (req, res) => {
  try {
    const { pack: packId } = req.body || {};
    if (!packId || !PACKS[packId]) {
      return res.status(400).json({ error: "Unknown pack." });
    }
    const pack = PACKS[packId];
    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const rz = await getRazorpay();

    if (rz) {
      /* ---------- REAL Razorpay order ---------- */
      const order = await rz.orders.create({
        amount: pack.price * 100, // paise
        currency: "INR",
        receipt: `exai_${packId}_${Date.now()}`,
        notes: {
          userId: String(req.userId),
          pack: packId,
          credits: String(pack.credits),
        },
      });
      return res.status(201).json({
        mode: "razorpay",
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        pack: packId,
        credits: pack.credits,
        key: process.env.RAZORPAY_KEY_ID,
      });
    }

    /* ---------- MOCK order (no Razorpay keys) ---------- */
    const mockOrderId = `mock_ord_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`;
    return res.status(201).json({
      mode: "mock",
      orderId: mockOrderId,
      amount: pack.price * 100,
      currency: "INR",
      pack: packId,
      credits: pack.credits,
    });
  } catch (error) {
    console.error("Create order failed:", error);
    return res.status(500).json({ error: "Could not create payment order." });
  }
};

/* ------------------------------------------------------------------ */
/*  Shared crediting + receipt + response (single source of truth)     */
/* ------------------------------------------------------------------ */
async function creditAndRespond(res, userId, packId, mode, razorpayPaymentId) {
  const pack = PACKS[packId];
  const updated = await UserModel.findByIdAndUpdate(
    userId,
    { $inc: { credits: pack.credits } },
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: "User not found." });

  // Re-enable generation once the balance is healthy again.
  if (updated.credits >= 7 && updated.isCreditAvailable === false) {
    updated.isCreditAvailable = true;
    try { await updated.save(); } catch { /* non-fatal */ }
  }

  logActivity({
    userId,
    kind: "Credits purchased",
    title: `Bought the ${pack.credits}-credit ${packId} pack`,
    detail: `₹${pack.price} — ${mode === "razorpay" ? "Razorpay" : "Mock"} payment confirmed`,
    credits: pack.credits,
  });

  const id = receiptId();
  const receipt = {
    id,
    pack: packId,
    credits: pack.credits,
    amount: pack.price,
    currency: "INR",
    razorpayPaymentId,
    createdAt: new Date().toISOString(),
    userId: String(userId),
  };
  receipts.set(id, receipt);

  return res.status(200).json({
    success: true,
    message: `Payment confirmed — ${pack.credits} credits added.`,
    receiptId: id,
    receipt,
    credits: pack.credits,
    amount: pack.price,
    creditBalance: updated.credits,
  });
}

/* ------------------------------------------------------------------ */
/*  POST /api/payment/verify                                           */
/*  Razorpay: verifies signature + order + capture → credits user.     */
/*  Mock (dev only): simulates verification → credits user.            */
/* ------------------------------------------------------------------ */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body || {};

    // The SERVER — never the client — decides which mode is in effect.
    // (Previously a client could send mode:"mock" and mint free credits.)
    const rz = await getRazorpay();

    /* ================= REAL Razorpay verification ================= */
    if (rz) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing Razorpay payment details.", charged: false });
      }

      // 1) Verify the HMAC signature with a constant-time comparison.
      const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      const given = String(razorpay_signature);
      const sigOk =
        expected.length === given.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given));
      if (!sigOk) {
        return res.status(400).json({ error: "Payment verification failed — signature mismatch.", charged: false });
      }

      // 2) Replay guard — a payment id can only ever be credited once.
      if (consumedPayments.has(razorpay_payment_id)) {
        return res.status(409).json({ error: "This payment has already been processed.", charged: false });
      }

      // 3) Trust ONLY the server-set order notes + the amount actually charged.
      //    The client's claimed pack is ignored, so a cheap order can never
      //    be redeemed for an expensive pack.
      let order;
      try {
        order = await rz.orders.fetch(razorpay_order_id);
      } catch (e) {
        console.error("Razorpay order fetch failed:", e?.message);
        return res.status(400).json({ error: "Could not verify the order with the payment provider.", charged: false });
      }
      const notesPack = order?.notes?.pack;
      if (!notesPack || !PACKS[notesPack]) {
        return res.status(400).json({ error: "Order is not linked to a valid credit pack.", charged: false });
      }
      if (String(order?.notes?.userId || "") !== String(req.userId)) {
        return res.status(403).json({ error: "This order does not belong to your account.", charged: false });
      }
      const pack = PACKS[notesPack];
      if (Number(order.amount) !== pack.price * 100) {
        return res.status(400).json({ error: "Order amount does not match the selected pack.", charged: false });
      }

      // 4) Confirm the payment was actually captured/authorized.
      let payment;
      try {
        payment = await rz.payments.fetch(razorpay_payment_id);
      } catch (e) {
        console.error("Razorpay payment fetch failed:", e?.message);
        return res.status(400).json({ error: "Could not confirm the payment with the provider.", charged: false });
      }
      if (payment?.status !== "captured" && payment?.status !== "authorized") {
        return res.status(402).json({ error: "Payment was not completed.", charged: false });
      }

      consumedPayments.add(razorpay_payment_id);
      return await creditAndRespond(res, req.userId, notesPack, "razorpay", razorpay_payment_id);
    }

    /* ================= MOCK verification (development only) ======== */
    // With no Razorpay keys we cannot take real money, so crediting here is
    // for LOCAL DEVELOPMENT ONLY and is refused outright in production.
    if (IS_PROD) {
      return res.status(503).json({ error: "Payments are not configured. Please try again later.", charged: false });
    }
    const { pack: packId } = req.body || {};
    if (!packId || !PACKS[packId]) {
      return res.status(400).json({ error: "Unknown pack." });
    }
    if (orderId && String(orderId).includes("decline")) {
      return res.status(402).json({ error: "Payment was declined.", charged: false });
    }
    const mockRef = orderId || `mock_${Date.now()}`;
    if (consumedPayments.has(mockRef)) {
      return res.status(409).json({ error: "This order has already been processed.", charged: false });
    }
    await new Promise((r) => setTimeout(r, 400));
    consumedPayments.add(mockRef);
    return await creditAndRespond(res, req.userId, packId, "mock", undefined);
  } catch (error) {
    console.error("Payment verify failed:", error);
    return res.status(500).json({ error: "Payment verification failed. Contact support if you were charged.", charged: false });
  }
};

/* ------------------------------------------------------------------ */
/*  GET /api/payment/receipt/:id                                       */
/* ------------------------------------------------------------------ */
export const getReceipt = async (req, res) => {
  const { id } = req.params;
  const receipt = receipts.get(id);
  if (!receipt) return res.status(404).json({ error: "Receipt not found." });
  if (String(receipt.userId) !== String(req.userId)) return res.status(403).json({ error: "Not your receipt." });
  return res.status(200).json({ receipt });
};
