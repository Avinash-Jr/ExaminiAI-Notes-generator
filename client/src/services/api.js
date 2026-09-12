import axios from "axios";
import { serverUrl } from "../App.jsx";
import { setUserData } from "../redux/userSlice.js";

// Simple idempotency key generator — prevents double-charge on retry/click
function newIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const getCurrentUser = async (dispatch) => {
  try {
    const result = await axios.get(`${serverUrl}/api/user/currentuser`, {
      withCredentials: true,
    });
    console.log("✅ Current user response:", result.data);
    dispatch(setUserData(result.data));
    return result.data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("ℹ️ No active session — rendering signed out.");
    } else {
      console.error(
        "❌ getCurrentUser failed:",
        error.response?.data || error.message,
      );
    }
    dispatch(setUserData(null));
    return null;
  }
};

export const generateNotes = async (payload, files = []) => {
  const idempotencyKey = newIdempotencyKey();
  try {
    let data;
    let headers = { "X-Idempotency-Key": idempotencyKey };

    if (files.length > 0) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value);
      });
      files.forEach((file) => formData.append("files", file));
      data = formData;
    } else {
      data = payload;
      headers["Content-Type"] = "application/json";
    }

    const result = await axios.post(
      `${serverUrl}/api/notes/generate-notes`,
      data,
      {
        withCredentials: true,
        timeout: 95000,
        headers,
      },
    );
    return result.data;
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Surface structured errors: { error, charged, retryable }
    if (data?.error) {
      const enriched = new Error(data.error);
      enriched.status = status;
      enriched.charged = data.charged === true;
      enriched.retryable = data.retryable === true;
      enriched.required = data.required;
      enriched.available = data.available;
      enriched.raw = data;
      throw enriched;
    }

    // Timeout vs network
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      const tErr = new Error(
        "Request timed out. The server took too long to respond. You were not charged — please retry.",
      );
      tErr.status = 504;
      tErr.retryable = true;
      tErr.charged = false;
      throw tErr;
    }
    if (!error.response) {
      const nErr = new Error(
        "Network error — please check your connection and retry. You were not charged.",
      );
      nErr.status = 0;
      nErr.retryable = true;
      nErr.charged = false;
      throw nErr;
    }
    console.error("❌ generateNotes failed:", data || error.message);
    throw error;
  }
};

export const getUserNotes = async () => {
  try {
    const result = await axios.get(`${serverUrl}/api/notes/my-notes`, {
      withCredentials: true,
    });
    return result.data.data;
  } catch (error) {
    console.error(
      "❌ getUserNotes failed:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getNoteById = async (id) => {
  try {
    const result = await axios.get(`${serverUrl}/api/notes/${id}`, {
      withCredentials: true,
    });
    return result.data.data;
  } catch (error) {
    console.error(
      "❌ getNoteById failed:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Download PDF via authenticated GET — triggers browser download
export const downloadNotePdf = async (id, filenameHint, options = {}) => {
  try {
    const response = await axios.get(`${serverUrl}/api/notes/${id}/pdf`, {
      withCredentials: true,
      responseType: "blob",
      timeout: 30000,
      params: options,
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Use server-provided filename if available, else hint
    const disposition = response.headers["content-disposition"] || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match
      ? match[1]
      : filenameHint
        ? `${filenameHint
            .replace(/[^a-z0-9-_ ]/gi, "")
            .trim()
            .slice(0, 60)
            .replace(/\s+/g, "-")}.pdf`
        : "notes.pdf";
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Let the browser finish consuming the object URL before releasing it.
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    return true;
  } catch (error) {
    console.error(
      "❌ downloadNotePdf failed:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

/**
 * Export notes in user-chosen format: markdown, html, latex, text, pdf
 */
export const exportNoteFile = async (id, format = "markdown", filenameHint = "notes", options = {}) => {
  if (format === "pdf") {
    return downloadNotePdf(id, filenameHint, options);
  }

  const extensions = {
    markdown: "md",
    html: "html",
    latex: "tex",
    text: "txt",
  };
  const mimeTypes = {
    markdown: "text/markdown",
    html: "text/html",
    latex: "text/x-tex",
    text: "text/plain",
  };

  const ext = extensions[format] || "md";
  const mime = mimeTypes[format] || "text/plain";

  try {
    const response = await axios.get(`${serverUrl}/api/notes/${id}/export`, {
      withCredentials: true,
      responseType: "blob",
      timeout: 30000,
      params: { format },
    });
    const blob = new Blob([response.data], { type: mime });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const disposition = response.headers["content-disposition"] || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const safeBase = filenameHint
      .replace(/[^a-z0-9-_ ]/gi, "")
      .trim()
      .slice(0, 60)
      .replace(/\s+/g, "-") || "notes";
    const filename = match ? match[1] : `${safeBase}.${ext}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    return true;
  } catch (error) {
    console.error(`❌ exportNoteFile (${format}) failed:`, error.response?.data || error.message);
    throw error;
  }
};


export const logout = async (dispatch) => {
  try {
    console.log("🔵 Logging out...");
    await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
    console.log("✅ Logged out successfully");
  } catch (error) {
    console.error(
      "❌ Logout request failed:",
      error.response?.data || error.message,
    );
  } finally {
    dispatch(setUserData(null));
  }
};

/**
 * Fetch user activity history from the real API.
 * @param {Object} [opts]
 * @param {string} [opts.kind]   — filter by event kind
 * @param {number} [opts.limit]  — max items
 * @param {string} [opts.before] — ISO timestamp for cursor pagination
 * @returns {Promise<Array>} array of activity events
 */
export const getActivity = async (opts = {}) => {
  try {
    const params = new URLSearchParams();
    if (opts.kind) params.set("kind", opts.kind);
    if (opts.limit) params.set("limit", String(opts.limit));
    if (opts.before) params.set("before", opts.before);

    const result = await axios.get(
      `${serverUrl}/api/activity?${params.toString()}`,
      {
        withCredentials: true,
      },
    );
    return result.data.data;
  } catch (error) {
    console.error(
      "❌ getActivity failed:",
      error.response?.data || error.message,
    );
    throw error;
  }
};
