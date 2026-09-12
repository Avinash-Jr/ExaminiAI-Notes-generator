const GROK_URL = process.env.GROK_URL || "https://api.x.ai/v1/chat/completions";

const GROK_CANDIDATE_MODELS = [
  process.env.GROK_MODEL,
  "grok-2-latest",
  "grok-beta",
  "grok-4.5",
].filter(Boolean);

const TIMEOUT_MS = 35000;
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

const isRetryableStatus = (status) =>
  status === 429 || (status >= 500 && status < 600);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504]);

export const generateGrokContent = async (prompt) => {
  const apiKey = process.env.GROK_API_KEY;

  if (!apiKey?.trim()) {
    const err = new Error("GROK_API_KEY is not configured in the environment.");
    err.statusCode = 500;
    throw err;
  }

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    const err = new Error("Prompt is required.");
    err.statusCode = 400;
    throw err;
  }

  let cleanPrompt = prompt.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
  const MAX_PROMPT_CHARS = 70000;
  if (cleanPrompt.length > MAX_PROMPT_CHARS) {
    console.warn(
      `[Grok] Prompt truncated from ${cleanPrompt.length} to ${MAX_PROMPT_CHARS} chars`,
    );
    cleanPrompt = cleanPrompt.slice(0, MAX_PROMPT_CHARS);
  }

  let lastError = null;
  let modelIndex = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const activeModel = GROK_CANDIDATE_MODELS[modelIndex] || "grok-2-latest";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(GROK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [{ role: "user", content: cleanPrompt }],
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 16384,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      let data;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (parseErr) {
          const err = new Error("Failed to parse Grok response JSON.");
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
          `Grok API request failed with status ${response.status}`;
        const err = new Error(apiMessage);
        if (response.status === 429) err.statusCode = 429;
        else if (response.status === 400) err.statusCode = 400;
        else if (response.status === 401 || response.status === 403)
          err.statusCode = 502;
        else if (response.status >= 500) err.statusCode = 502;
        else err.statusCode = response.status;
        err.upstreamStatus = response.status;

        if ((response.status === 404 || response.status === 400) && modelIndex < GROK_CANDIDATE_MODELS.length - 1) {
          modelIndex++;
          console.warn(
            `[Grok] Model ${activeModel} failed with ${response.status}. Trying candidate model: ${GROK_CANDIDATE_MODELS[modelIndex]}`,
          );
          lastError = err;
          continue;
        }

        if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
          const delay =
            BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 250;
          console.warn(
            `[Grok] Retry ${attempt + 1}/${MAX_RETRIES} after ${response.status} — waiting ${Math.round(delay)}ms`,
          );
          await sleep(delay);
          lastError = err;
          continue;
        }
        throw err;
      }

      const text = data?.choices?.[0]?.message?.content?.trim() || "";

      if (!text) {
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(
            `[Grok] Empty response, retry ${attempt + 1}/${MAX_RETRIES}`,
          );
          await sleep(delay);
          lastError = new Error("Grok returned an empty response.");
          lastError.statusCode = 502;
          continue;
        }
        const err = new Error("Grok returned an empty response after retries.");
        err.statusCode = 502;
        throw err;
      }

      return { text, raw: data };
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === "AbortError") {
        const timeoutErr = new Error(
          `Grok request timed out after ${TIMEOUT_MS}ms`,
        );
        timeoutErr.statusCode = 504;
        if (attempt < MAX_RETRIES) {
          console.warn(`[Grok] Timeout retry ${attempt + 1}/${MAX_RETRIES}`);
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
            `[Grok] Network error retry ${attempt + 1}/${MAX_RETRIES}: ${error.message}`,
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
  throw lastError || new Error("Grok request failed after retries.");
};
