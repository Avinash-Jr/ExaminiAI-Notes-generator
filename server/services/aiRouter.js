import { generateGeminiContent } from "./gemini.services.js";
import { generateOpenRouterContent } from "./openrouter.services.js";

const FALLBACK_ENABLED = process.env.FALLBACK_ENABLED !== "false";
const OPENROUTER_ENABLED = process.env.OPENROUTER_ENABLED !== "false";

const CIRCUIT_THRESHOLD =
  parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD, 10) || 3;
const CIRCUIT_COOLDOWN_MS =
  parseInt(process.env.CIRCUIT_BREAKER_COOLDOWN_MS, 10) || 120_000;

const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504]);

const circuit = {
  failures: 0,
  openUntil: 0,
  lastFailures: [],
};
const unavailableProviders = new Set(OPENROUTER_ENABLED ? [] : ["openrouter"]);

function isProviderAvailable(provider) {
  if (provider === "openrouter" && !process.env.OPENROUTER_API_KEY?.trim()) {
    return false;
  }
  return !unavailableProviders.has(provider);
}

function markProviderUnavailable(provider, error) {
  if (!["gemini", "openrouter"].includes(provider)) return;
  if (![401, 403].includes(error?.upstreamStatus)) return;
  unavailableProviders.add(provider);
  console.warn(
    `[FALLBACK] ${provider} disabled for this process after an authorization failure.`,
  );
}

function isCircuitOpen() {
  if (Date.now() < circuit.openUntil) return true;
  if (circuit.openUntil > 0 && Date.now() >= circuit.openUntil) {
    circuit.failures = 0;
    circuit.openUntil = 0;
    circuit.lastFailures = [];
    console.log(
      "[FALLBACK] Circuit breaker reset — Gemini will be tried again.",
    );
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
        `Routing to OpenRouter until ${new Date(circuit.openUntil).toISOString()}`,
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
  return RETRYABLE_CODES.has(code) || error?.name === "AbortError" || code === 404;
}

function logFallback(reason, fromProvider, toProvider, extra = "") {
  const ts = new Date().toISOString();
  const circuitState = isCircuitOpen()
    ? `open(${circuit.failures}/${CIRCUIT_THRESHOLD})`
    : `closed(${circuit.failures}/${CIRCUIT_THRESHOLD})`;
  console.warn(
    `[FALLBACK] ${ts} | ${fromProvider}→${toProvider} | reason: ${reason} | circuit: ${circuitState}${extra ? " | " + extra : ""}`,
  );
}

/**
 * Unified content generation — tries Gemini first, falls back to OpenRouter on
 * any Gemini failure when OpenRouter is available. Returns { text, provider, raw }.
 */
export const generateContent = async (prompt) => {
  if (!FALLBACK_ENABLED) {
    const result = await generateGeminiContent(prompt);
    return { ...result, provider: "gemini" };
  }

  const circuitOpen = isCircuitOpen();

  if (circuitOpen && isProviderAvailable("openrouter")) {
    logFallback("circuit-open", "gemini", "openrouter", "skipping Gemini entirely");
    try {
      const result = await generateOpenRouterContent(prompt);
      return { ...result, provider: "openrouter" };
    } catch (fallbackError) {
      console.error(
        "[FALLBACK] OpenRouter also failed during circuit-open:",
        fallbackError.message,
      );
      const err = new Error(
        "AI service is temporarily unavailable. Please try again later.",
      );
      err.statusCode = fallbackError.statusCode || 502;
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
    recordGeminiFailure(geminiError);
    const reason =
      geminiError.upstreamStatus ||
      geminiError.statusCode ||
      geminiError.name ||
      geminiError.message ||
      "error";

    // If OpenRouter fallback is available, trigger fallback
    if (isProviderAvailable("openrouter")) {
      logFallback(
        reason,
        "gemini",
        "openrouter",
        `Gemini failed: ${geminiError.message}`,
      );
      try {
        const result = await generateOpenRouterContent(prompt);
        return { ...result, provider: "openrouter" };
      } catch (fallbackError) {
        markProviderUnavailable("openrouter", fallbackError);
        console.error(
          "[FALLBACK] Both providers failed.",
          `Gemini: ${geminiError.message}`,
          `OpenRouter: ${fallbackError.message}`,
        );
        const err = new Error(
          "AI service is temporarily unavailable. Please try again later.",
        );
        err.statusCode = 502;
        err.charged = false;
        err.retryable = true;
        throw err;
      }
    }

    // OpenRouter not available; rethrow Gemini error
    throw geminiError;
  }
};

function generateFromProvider(prompt, provider) {
  return provider === "gemini"
    ? generateGeminiContent(prompt)
    : generateOpenRouterContent(prompt);
}

/**
 * Use the other configured model for a quality-repair pass. If that provider
 * is unavailable or unauthorized, retry the repair with the original model
 * instead of discarding an otherwise recoverable generation.
 */
export const generateAlternateContent = async (prompt, currentProvider) => {
  const alternateProvider = currentProvider === "openrouter" ? "gemini" : "openrouter";
  if (!isProviderAvailable(alternateProvider)) {
    const provider = currentProvider || "gemini";
    logFallback(
      "provider-disabled",
      alternateProvider,
      provider,
      "quality-repair",
    );
    const result = await generateFromProvider(prompt, provider);
    return { ...result, provider };
  }
  logFallback(
    "quality-repair",
    currentProvider || "unknown",
    alternateProvider,
  );

  try {
    const result = await generateFromProvider(prompt, alternateProvider);
    return { ...result, provider: alternateProvider };
  } catch (alternateError) {
    markProviderUnavailable(alternateProvider, alternateError);
    if (currentProvider !== "gemini" && currentProvider !== "openrouter") {
      throw alternateError;
    }

    const fallbackToOriginal = currentProvider;
    logFallback(
      "alternate-failed",
      alternateProvider,
      fallbackToOriginal,
      alternateError.message,
    );
    const result = await generateFromProvider(prompt, fallbackToOriginal);
    return { ...result, provider: fallbackToOriginal };
  }
};
