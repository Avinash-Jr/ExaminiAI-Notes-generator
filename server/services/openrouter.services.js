const OPENROUTER_URL =
  process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1/chat/completions";

const OPENROUTER_CANDIDATE_MODELS = [
  process.env.OPENROUTER_MODEL,
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "qwen/qwen-2.5-coder-32b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "deepseek/deepseek-r1:free",
].filter(Boolean);

const TIMEOUT_MS = 20000;
const MAX_RETRIES = 1;
const BASE_DELAY_MS = 1000;

const isRetryableStatus = (status) =>
  status === 429 || (status >= 500 && status < 600);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504]);

export const generateOpenRouterContent = async (prompt) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey?.trim()) {
    const err = new Error(
      "OPENROUTER_API_KEY is not configured in the environment.",
    );
    err.statusCode = 500;
    throw err;
  }

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    const err = new Error("Prompt must be a non-empty string.");
    err.statusCode = 400;
    throw err;
  }

  let cleanPrompt = prompt.trim();
  const MAX_PROMPT_CHARS = 120_000;
  if (cleanPrompt.length > MAX_PROMPT_CHARS) {
    console.warn(
      `[OpenRouter] Prompt truncated from ${cleanPrompt.length} to ${MAX_PROMPT_CHARS} chars`,
    );
    cleanPrompt = cleanPrompt.slice(0, MAX_PROMPT_CHARS);
  }

  let lastError = null;
  let modelIndex = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const activeModel =
      OPENROUTER_CANDIDATE_MODELS[modelIndex] || "google/gemini-2.0-flash-exp:free";

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
          "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
          "X-Title": "ExaminAI Notes Generator",
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [{ role: "user", content: cleanPrompt }],
          temperature: 0.3,
          max_tokens: 16384,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errBody = "";
        let errorData = null;
        try {
          errBody = await response.text();
          errorData = JSON.parse(errBody);
        } catch {
          // ignore parse error
        }

        const message =
          errorData?.error?.message ||
          errorData?.message ||
          `OpenRouter API request failed with status ${response.status}`;

        const err = new Error(message);
        err.upstreamStatus = response.status;
        err.statusCode = response.status;
        err.provider = "openrouter";
        err.model = activeModel;
        err.retryable = isRetryableStatus(response.status);
        lastError = err;

        // If a free model is unavailable or unknown, cycle to next candidate model
        if (
          (response.status === 404 || response.status === 400 || response.status === 429) &&
          modelIndex < OPENROUTER_CANDIDATE_MODELS.length - 1
        ) {
          modelIndex += 1;
          console.warn(
            `[OpenRouter] Model ${activeModel} returned ${response.status}. Trying candidate model: ${OPENROUTER_CANDIDATE_MODELS[modelIndex]}`,
          );
        }

        if (err.retryable && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * 2 ** attempt + Math.random() * 500;
          console.warn(
            `[OpenRouter] Retry ${attempt + 1}/${MAX_RETRIES} after ${response.status} — waiting ${Math.round(delay)}ms`,
          );
          await sleep(delay);
          continue;
        }

        throw err;
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;

      if (!text || !text.trim()) {
        if (attempt < MAX_RETRIES) {
          console.warn(
            `[OpenRouter] Empty response from ${activeModel}, retry ${attempt + 1}/${MAX_RETRIES}`,
          );
          if (modelIndex < OPENROUTER_CANDIDATE_MODELS.length - 1) modelIndex += 1;
          await sleep(BASE_DELAY_MS * 2 ** attempt);
          continue;
        }
        lastError = new Error("OpenRouter returned an empty response.");
        lastError.statusCode = 502;
        lastError.provider = "openrouter";
        throw lastError;
      }

      return {
        text: text.trim(),
        raw: data,
        model: activeModel,
        provider: "openrouter",
      };
    } catch (error) {
      if (error.name === "AbortError") {
        lastError = new Error(
          `OpenRouter request timed out after ${TIMEOUT_MS}ms`,
        );
        lastError.statusCode = 504;
        lastError.provider = "openrouter";
        lastError.retryable = true;
        if (attempt < MAX_RETRIES) {
          console.warn(`[OpenRouter] Timeout retry ${attempt + 1}/${MAX_RETRIES}`);
          if (modelIndex < OPENROUTER_CANDIDATE_MODELS.length - 1) modelIndex += 1;
          await sleep(BASE_DELAY_MS * 2 ** attempt);
          continue;
        }
        throw lastError;
      }

      if (error.upstreamStatus || error.statusCode) {
        lastError = error;
      } else {
        lastError = new Error(error.message || "OpenRouter network request failed.");
        lastError.statusCode = 503;
        lastError.provider = "openrouter";
        lastError.retryable = true;
      }

      if (attempt < MAX_RETRIES && lastError.retryable) {
        console.warn(
          `[OpenRouter] Network error retry ${attempt + 1}/${MAX_RETRIES}: ${error.message}`,
        );
        if (modelIndex < OPENROUTER_CANDIDATE_MODELS.length - 1) modelIndex += 1;
        await sleep(BASE_DELAY_MS * 2 ** attempt);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error("OpenRouter request failed after retries.");
};

// Backward-compatible alias
export const generateGrokContent = generateOpenRouterContent;
