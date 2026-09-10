import UserModel from "../models/user.models.js";
import crypto from "crypto";
import { logActivity } from "../utils/logActivity.js";

const PACKS = {
  starter: { credits: 120, price: 199 },
  popular: { credits: 300, price: 399 },
  pro: { credits: 650, price: 699 },
};

// In-memory receipt store (use a real DB collection in production)
const receipts = new Map();

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
/*  POST /api/payment/verify                                           */
/*  Razorpay: verifies signature → credits user.                       */
/*  Mock: simulates verification → credits user.                       */
/* ------------------------------------------------------------------ */
export const verifyPayment = async (req, res) => {
  try {
    const { mode, razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, pack: packId } = req.body || {};

    if (!packId || !PACKS[packId]) {
      return res.status(400).json({ error: "Unknown pack." });
    }
    const pack = PACKS[packId];

    if (mode === "razorpay") {
      /* ---------- REAL Razorpay verification ---------- */
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing Razorpay payment details." });
      }

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Payment verification failed — signature mismatch.", charged: false });
      }
    } else {
      /* ---------- MOCK verification ---------- */
      // Simulated declines for testing
      if (orderId && orderId.includes("decline")) {
        return res.status(402).json({ error: "Payment was declined.", charged: false });
      }
      // Simulate processing delay
      await new Promise((r) => setTimeout(r, 650));
    }

    /* ---------- Credit the user ---------- */
    const updated = await UserModel.findByIdAndUpdate(
      req.userId,
      { $inc: { credits: pack.credits } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "User not found." });

    // Log the purchase activity
    logActivity({
      userId: req.userId,
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
      razorpayPaymentId: mode === "razorpay" ? razorpay_payment_id : undefined,
      createdAt: new Date().toISOString(),
      userId: String(req.userId),
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
