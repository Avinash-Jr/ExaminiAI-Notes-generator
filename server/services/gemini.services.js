const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

export const generateGeminiContent = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!prompt?.trim()) {
    throw new Error("Prompt is required.");
  }

  if (!apiKey?.trim()) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }

  try {
    const response = await fetch(
      `${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
          `Gemini API request failed with status ${response.status}`
      );
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || "")
        .join("")
        .trim() || "";

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return {
      text,
      raw: data,
    };
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
  const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleanText);
};