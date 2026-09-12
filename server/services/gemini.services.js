// Gemini API integration — production hardened
// BEFORE: model "gemini-3.5-flash" did not exist → 404 on every call
// AFTER: "gemini-1.5-flash" + timeout + retry + parsing + sanitization

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro",
  "gemini-3.0-pro",
  "gemini-3.0-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
].filter(Boolean);

const getGeminiEndpoint = (modelIndex = 0) => {
  if (process.env.GEMINI_URL && modelIndex === 0) {
    return process.env.GEMINI_URL;
  }
  const modelName = CANDIDATE_MODELS[modelIndex] || "gemini-3.1-flash-lite";
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
};

const TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

const isRetryableStatus = (status) =>
  status === 429 || (status >= 500 && status < 600);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const generateGeminiContent = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    const err = new Error("Prompt is required.");
    err.statusCode = 400;
    throw err;
  }

  // Sanitize control characters while allowing the full structured prompt and reference context through.
  let cleanPrompt = prompt.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
  const MAX_PROMPT_CHARS = 70000;
  if (cleanPrompt.length > MAX_PROMPT_CHARS) {
    console.warn(
      `Prompt truncated from ${cleanPrompt.length} to ${MAX_PROMPT_CHARS} chars`,
    );
    cleanPrompt = cleanPrompt.slice(0, MAX_PROMPT_CHARS);
  }

  if (!apiKey?.trim()) {
    const err = new Error(
      "GEMINI_API_KEY is not configured in the environment.",
    );
    err.statusCode = 500;
    throw err;
  }

  let lastError = null;
  let modelIndex = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const targetUrl = getGeminiEndpoint(modelIndex);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(
        `${targetUrl}?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: cleanPrompt }] }],
            generationConfig: {
              temperature: 0.3,
              topP: 0.9,
              maxOutputTokens: 16384,
            },
          }),
          signal: controller.signal,
        },
      );
      clearTimeout(timeout);

      let data;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (parseErr) {
          const err = new Error("Failed to parse Gemini response JSON.");
          err.statusCode = 502;
          err.cause = parseErr;
          throw err;
        }
      } else {
        const textBody = await response.text();
        data = { error: { message: textBody.slice(0, 500) } };
      }

      if (!response.ok) {
        const apiMessage =
          data?.error?.message ||
          `Gemini API request failed with status ${response.status}`;
        const err = new Error(apiMessage);
        if (response.status === 429) err.statusCode = 429;
        else if (response.status === 400) err.statusCode = 400;
        else if (response.status === 401 || response.status === 403)
          err.statusCode = 502;
        else if (response.status >= 500) err.statusCode = 502;
        else err.statusCode = response.status;
        err.upstreamStatus = response.status;
        err.upstreamBody = data;
        if (
          data?.promptFeedback?.blockReason ||
          data?.candidates?.[0]?.finishReason === "SAFETY"
        ) {
          err.statusCode = 422;
          err.message =
            "Request blocked by content safety filters. Please rephrase your topic.";
        }
        if (
          response.status === 404 &&
          modelIndex < CANDIDATE_MODELS.length - 1
        ) {
          modelIndex++;
          console.warn(
            `Gemini model ${getGeminiEndpoint(modelIndex - 1)} returned 404. Falling back to candidate model: ${getGeminiEndpoint(modelIndex)}`,
          );
          lastError = err;
          continue;
        }

        if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
          const delay =
            BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 250;
          console.warn(
            `Gemini retry ${attempt + 1}/${MAX_RETRIES} after ${response.status} — waiting ${Math.round(delay)}ms`,
          );
          await sleep(delay);
          lastError = err;
          continue;
        }
        throw err;
      }

      const candidate = data?.candidates?.[0];
      if (!candidate) {
        if (data?.promptFeedback?.blockReason) {
          const err = new Error(
            `Prompt blocked: ${data.promptFeedback.blockReason}`,
          );
          err.statusCode = 422;
          throw err;
        }
        const err = new Error(
          "Gemini returned no candidates — unexpected response structure.",
        );
        err.statusCode = 502;
        err.raw = data;
        throw err;
      }
      if (candidate.finishReason === "SAFETY") {
        const err = new Error("Generation blocked by safety filters.");
        err.statusCode = 422;
        throw err;
      }
      const parts = candidate?.content?.parts;
      const text = Array.isArray(parts)
        ? parts
            .map((p) => (typeof p?.text === "string" ? p.text : ""))
            .join("")
            .trim()
        : "";
      if (!text) {
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(
            `Gemini empty response, retry ${attempt + 1}/${MAX_RETRIES}`,
          );
          await sleep(delay);
          lastError = new Error("Gemini returned an empty response.");
          lastError.statusCode = 502;
          continue;
        }
        const err = new Error(
          "Gemini returned an empty response after retries.",
        );
        err.statusCode = 502;
        err.raw = data;
        throw err;
      }
      return { text, raw: data };
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === "AbortError") {
        const timeoutErr = new Error(
          `Gemini request timed out after ${TIMEOUT_MS}ms`,
        );
        timeoutErr.statusCode = 504;
        if (attempt < MAX_RETRIES) {
          console.warn(`Timeout retry ${attempt + 1}/${MAX_RETRIES}`);
          await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
          lastError = timeoutErr;
          continue;
        }
        throw timeoutErr;
      }
      if (error instanceof TypeError && error.message.includes("fetch")) {
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(
            `Network error retry ${attempt + 1}/${MAX_RETRIES}: ${error.message}`,
          );
          await sleep(delay);
          lastError = error;
          lastError.statusCode = 502;
          continue;
        }
        error.statusCode = error.statusCode || 502;
        throw error;
      }
      if (
        error.statusCode &&
        isRetryableStatus(error.upstreamStatus || error.statusCode) &&
        attempt < MAX_RETRIES
      ) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error("Gemini request failed after retries.");
};
