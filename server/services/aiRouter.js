import { generateGeminiContent } from "./gemini.services.js";
import { generateGrokContent } from "./grok.services.js";

const FALLBACK_ENABLED = process.env.FALLBACK_ENABLED !== "false";

const CIRCUIT_THRESHOLD = parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD, 10) || 3;
const CIRCUIT_COOLDOWN_MS =
  parseInt(process.env.CIRCUIT_BREAKER_COOLDOWN_MS, 10) || 120_000;

const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504]);

const circuit = {
  failures: 0,
  openUntil: 0,
  lastFailures: [],
};

function isCircuitOpen() {
  if (Date.now() < circuit.openUntil) return true;
  if (circuit.openUntil > 0 && Date.now() >= circuit.openUntil) {
    circuit.failures = 0;
    circuit.openUntil = 0;
    circuit.lastFailures = [];
    console.log("[FALLBACK] Circuit breaker reset — Gemini will be tried again.");
  }
  return false;
}

function recordGeminiFailure(error) {
  const now = Date.now();
  circuit.lastFailures.push(now);
  const windowStart = now - 5 * 60 * 1000;
  circuit.lastFailures = circuit.lastFailures.filter((t) => t > windowStart);
  circuit.failures = circuit.lastFailures.length;

  if (circuit.failures >= CIRCUIT_THRESHOLD) {
    circuit.openUntil = now + CIRCUIT_COOLDOWN_MS;
    console.warn(
      `[FALLBACK] Circuit OPEN — ${circuit.failures} Gemini failures in 5 min. ` +
        `Routing to Grok until ${new Date(circuit.openUntil).toISOString()}`
    );
  }
}

function recordGeminiSuccess() {
  if (circuit.failures > 0) {
    circuit.failures = 0;
    circuit.lastFailures = [];
    circuit.openUntil = 0;
  }
}

function isRetryable(error) {
  const code = error?.upstreamStatus || error?.statusCode;
  return RETRYABLE_CODES.has(code) || error?.name === "AbortError";
}

function logFallback(reason, fromProvider, toProvider, extra = "") {
  const ts = new Date().toISOString();
  const circuitState = isCircuitOpen()
    ? `open(${circuit.failures}/${CIRCUIT_THRESHOLD})`
    : `closed(${circuit.failures}/${CIRCUIT_THRESHOLD})`;
  console.warn(
    `[FALLBACK] ${ts} | ${fromProvider}→${toProvider} | reason: ${reason} | circuit: ${circuitState}${extra ? " | " + extra : ""}`
  );
}

/**
 * Unified content generation — tries Gemini first, falls back to Grok on
 * retryable errors. Returns { text, provider, raw }.
 */
export const generateContent = async (prompt) => {
  if (!FALLBACK_ENABLED) {
    const result = await generateGeminiContent(prompt);
    return { ...result, provider: "gemini" };
  }

  const circuitOpen = isCircuitOpen();

  if (circuitOpen) {
    logFallback("circuit-open", "gemini", "grok", "skipping Gemini entirely");
    try {
      const result = await generateGrokContent(prompt);
      return { ...result, provider: "grok" };
    } catch (grokError) {
      console.error("[FALLBACK] Grok also failed during circuit-open:", grokError.message);
      const err = new Error(
        "AI service is temporarily unavailable. Please try again later."
      );
      err.statusCode = grokError.statusCode || 502;
      err.charged = false;
      err.retryable = true;
      throw err;
    }
  }

  try {
    const result = await generateGeminiContent(prompt);
    recordGeminiSuccess();
    return { ...result, provider: "gemini" };
  } catch (geminiError) {
    if (!isRetryable(geminiError)) {
      throw geminiError;
    }

    recordGeminiFailure(geminiError);
    const reason =
      geminiError.upstreamStatus || geminiError.statusCode || geminiError.name;
    logFallback(reason, "gemini", "grok");

    try {
      const result = await generateGrokContent(prompt);
      return { ...result, provider: "grok" };
    } catch (grokError) {
      console.error(
        "[FALLBACK] Both providers failed.",
        `Gemini: ${geminiError.message}`,
        `Grok: ${grokError.message}`
      );
      const err = new Error(
        "AI service is temporarily unavailable. Please try again later."
      );
      err.statusCode = 502;
      err.charged = false;
      err.retryable = true;
      throw err;
    }
  }
};
