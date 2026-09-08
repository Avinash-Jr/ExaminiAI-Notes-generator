import UserModel from "../models/user.models.js";
import NotesModel from "../models/notes.models.js";
import { generateGeminiContent } from "../services/gemini.services.js";
import { buildPrompt } from "../utils/promptBuilder.js";

// In-memory idempotency guard (per-process). For multi-instance deploy, replace with Redis.
// Stores: key -> { status: "processing"|"done", result, expiresAt }
const idempotencyStore = new Map();
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000; // 5 min

function getIdempotencyKey(req) {
  return req.headers["x-idempotency-key"] || req.headers["idempotency-key"] || null;
}

function cleanupIdempotency() {
  const now = Date.now();
  for (const [k, v] of idempotencyStore) {
    if (v.expiresAt < now) idempotencyStore.delete(k);
  }
}
setInterval(cleanupIdempotency, 60 * 1000).unref?.();

// Credit cost matches client estimate: depth-based + diagrams
const DEPTH_COST = { tight: 5, balanced: 7, thorough: 10 };
const DIAGRAM_COST = 3;
function computeCost({ depth, diagrams }) {
  const base = DEPTH_COST[depth] ?? 7;
  return base + (diagrams ? DIAGRAM_COST : 0);
}

export const generateNotes = async (req, res) => {
  const idempotencyKey = getIdempotencyKey(req);

  // Idempotency: if same key already succeeded, replay same response — no double charge
  if (idempotencyKey) {
    const existing = idempotencyStore.get(idempotencyKey);
    if (existing?.status === "done") {
      return res.status(201).json(existing.result);
    }
    if (existing?.status === "processing") {
      return res.status(409).json({ error: "Generation already in progress for this request. Please wait." });
    }
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, { status: "processing", expiresAt: Date.now() + IDEMPOTENCY_TTL_MS });
    }
  }

  try {
    const { topic, subject, format, examType, revisionMode, includeDiagrams, includeCharts, material } = req.body;

    // Validation: sanitize inputs
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "Topic is required." });
    }
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ error: "Subject is required." });
    }
    if (!format) {
      return res.status(400).json({ error: "Format is required." });
    }
    if (!examType) {
      return res.status(400).json({ error: "Exam type / detail level is required." });
    }

    const cleanTopic = topic.trim().slice(0, 500);
    const cleanSubject = subject.trim().slice(0, 200);
    const cleanMaterial = typeof material === "string" ? material.trim().slice(0, 10000) : undefined;

    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Map examType depth to cost key
    const depthKey = ["tight", "balanced", "thorough"].includes(examType) ? examType : "balanced";
    const cost = computeCost({ depth: depthKey, diagrams: Boolean(includeDiagrams) });

    // Pre-generation: validate but DO NOT deduct yet (reservation check)
    if (user.credits < cost) {
      user.isCreditAvailable = false;
      await user.save();
      return res.status(403).json({
        error: `Insufficient credits. Need ${cost}, you have ${user.credits}.`,
        required: cost,
        available: user.credits,
      });
    }

    const prompt = buildPrompt({
      topic: cleanTopic,
      subject: cleanSubject,
      format,
      examType,
      revisionMode,
      includeDiagrams: Boolean(includeDiagrams),
      includeCharts: Boolean(includeCharts),
      material: cleanMaterial,
    });

    // === Generation — credits NOT YET DEDUCTED ===
    let aiResponse;
    try {
      aiResponse = await generateGeminiContent(prompt);
    } catch (genError) {
      // No charge on failure — rollback path
      console.error("Gemini generation failed (no charge):", genError.message);

      // Map error codes to HTTP statuses
      const statusCode = genError.statusCode || 500;
      const message =
        statusCode === 429
          ? "AI service is rate-limited. Please wait a minute and try again — you were not charged."
          : statusCode === 422
          ? genError.message
          : statusCode === 504
          ? "Generation timed out. Please retry — you were not charged."
          : statusCode === 502
          ? "AI service is temporarily unavailable. Please retry — you were not charged."
          : genError.message || "Failed to generate notes. You were not charged.";

      // Clean idempotency on failure so retry can proceed
      if (idempotencyKey) idempotencyStore.delete(idempotencyKey);

      return res.status(statusCode).json({
        error: message,
        charged: false,
        retryable: [429, 502, 504].includes(statusCode),
      });
    }

    // Validate output — empty/invalid content must not be charged
    if (!aiResponse?.text || !aiResponse.text.trim()) {
      if (idempotencyKey) idempotencyStore.delete(idempotencyKey);
      return res.status(502).json({
        error: "Generation returned empty content. You were not charged. Please retry.",
        charged: false,
        retryable: true,
      });
    }

    if (aiResponse.text.trim().length < 50) {
      if (idempotencyKey) idempotencyStore.delete(idempotencyKey);
      return res.status(502).json({
        error: "Generation returned too little content. You were not charged. Please retry.",
        charged: false,
        retryable: true,
      });
    }

    // === ATOMIC COMMIT: deduct credits ONLY after successful generation ===
    // Use atomic findOneAndUpdate with credit check to prevent race conditions
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: user._id, credits: { $gte: cost } },
      { $inc: { credits: -cost } },
      { new: true }
    );

    if (!updatedUser) {
      // Race: credits consumed between check and commit
      if (idempotencyKey) idempotencyStore.delete(idempotencyKey);
      return res.status(409).json({
        error: "Credits changed during generation. Please retry — you were not charged for this attempt.",
        charged: false,
        retryable: true,
      });
    }

    // Update isCreditAvailable flag
    if (updatedUser.credits < 7) {
      updatedUser.isCreditAvailable = false;
      await updatedUser.save();
    }

    // Persist notes — if this fails we must REFUND
    let notes;
    try {
      notes = await NotesModel.create({
        user: updatedUser._id,
        topic: cleanTopic,
        subject: cleanSubject,
        format,
        examType,
        revisionMode: Boolean(revisionMode),
        includeDiagrams: Boolean(includeDiagrams),
        includeCharts: Boolean(includeCharts),
        content: aiResponse.text,
      });
    } catch (dbError) {
      // Refund on DB failure
      console.error("Failed to save notes, refunding credits:", dbError.message);
      await UserModel.findByIdAndUpdate(updatedUser._id, { $inc: { credits: cost } });
      if (idempotencyKey) idempotencyStore.delete(idempotencyKey);
      return res.status(500).json({
        error: "Failed to save generated notes. Credits refunded. Please retry.",
        charged: false,
        retryable: true,
      });
    }

    // Track notes array (non-critical — log but do not fail)
    try {
      if (!Array.isArray(updatedUser.notes)) updatedUser.notes = [];
      updatedUser.notes.push(notes._id);
      await updatedUser.save();
    } catch (e) {
      console.warn("Failed to push note to user.notes array:", e.message);
    }

    const resultPayload = {
      data: aiResponse,
      noteId: notes._id,
      creditRemaining: updatedUser.credits,
      creditsCharged: cost,
      charged: true,
      message: "Notes generated successfully.",
      notes,
    };

    // Store idempotency success for replay
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, {
        status: "done",
        result: resultPayload,
        expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
      });
    }

    return res.status(201).json(resultPayload);
  } catch (error) {
    console.error("Error generating notes:", error);
    if (idempotencyKey) idempotencyStore.delete(idempotencyKey);
    // Avoid leaking internals; map known codes
    const status = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    return res.status(status).json({
      error: error.message || "An error occurred while generating notes. You were not charged if no notes were returned.",
      charged: false,
    });
  }
};
