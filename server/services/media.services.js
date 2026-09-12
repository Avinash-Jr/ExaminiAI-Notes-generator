// Fetches real, licensed images for a topic — Wikimedia Commons (no API key).
// Used to turn AI's [[IMAGE: keywords | caption]] markers into actual <img> sources
// and to supplement notes with an illustration gallery when the model omits one.

const WIKI_SEARCH = "https://commons.wikimedia.org/w/api.php";
const WIKI_ORIGIN = "&origin=*";
const TIMEOUT_MS = 7000;

// Simple in-memory cache: query -> { urls, at }
const cache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal, headers: { "User-Agent": "ExaminAI/1.0 (contact@examinai.app)" } });
    return r;
  } finally { clearTimeout(t); }
}

/**
 * Search Wikimedia Commons for images matching q and return up to `limit`
 * direct image URLs (upload.wikimedia.org). Filters to jpg/png/webp.
 * Uses tiered query simplification to ensure relevant images are discovered.
 */
export async function fetchWikimediaImages(q, limit = 3) {
  if (!q || !q.trim()) return [];
  const rawQuery = q.trim();
  const key = `${rawQuery}::${limit}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.urls;

  // Build tiered candidate queries to maximize hit rate
  const words = rawQuery.replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
  const candidateQueries = [rawQuery];
  if (words.length > 2) {
    candidateQueries.push(words.slice(0, 2).join(" "));
  }
  if (words.length > 3) {
    candidateQueries.push(words.slice(0, 3).join(" "));
  }
  if (words.length > 0 && words[0].length > 3) {
    candidateQueries.push(words[0]);
  }

  const seenUrls = new Set();
  const collected = [];

  for (const candidate of candidateQueries) {
    try {
      const searchUrl = `${WIKI_SEARCH}?action=query&list=search&srsearch=${encodeURIComponent(candidate)}&srnamespace=6&srlimit=${limit * 2}&format=json${WIKI_ORIGIN}`;
      const sr = await fetchWithTimeout(searchUrl);
      if (!sr.ok) continue;
      const sj = await sr.json();
      const titles = (sj?.query?.search || []).map((s) => s.title).filter(Boolean).slice(0, limit * 2);
      if (!titles.length) continue;

      const titlesParam = titles.map((t) => encodeURIComponent(t)).join("|");
      const infoUrl = `${WIKI_SEARCH}?action=query&titles=${titlesParam}&prop=imageinfo&iiprop=url|mime&format=json${WIKI_ORIGIN}`;
      const ir = await fetchWithTimeout(infoUrl);
      if (!ir.ok) continue;
      const ij = await ir.json();
      const pages = Object.values(ij?.query?.pages || {});
      for (const p of pages) {
        const info = p?.imageinfo?.[0];
        const url = info?.url || "";
        const mime = info?.mime || "";
        if (!url || seenUrls.has(url)) continue;
        if (!/^https:\/\//.test(url)) continue;
        if (mime && !/image\/(jpeg|png|webp|svg\+xml)/.test(mime)) continue;
        seenUrls.add(url);
        collected.push({
          url,
          title: p.title?.replace(/^File:/, "") || candidate,
          mime,
        });
        if (collected.length >= limit) break;
      }
      if (collected.length >= limit) break;
    } catch {
      // try next candidate
    }
  }

  if (collected.length) {
    cache.set(key, { urls: collected, at: Date.now() });
  }
  return collected;
}

/**
 * Resolve all [[IMAGE: keywords | caption]] markers in `text` to real images.
 * Returns { text: textWithMarkdownImages, media: [{url,caption,query}] }.
 * If no markers, still fetches 1–2 gallery images for the topic as supplement.
 */
export async function enrichWithMedia(text, { topic, subject }) {
  const media = [];
  let out = String(text || "");

  // Strip any raw HTML the model may have emitted — never show HTML to user
  out = out.replace(/<[^>]*>/g, "");

  const markerRe = /\[\[IMAGE:\s*([^\]|]+?)\s*\|\s*([^\]]+?)\s*\]\]/gi;
  const markers = [...out.matchAll(markerRe)];

  for (const m of markers) {
    const query = m[1].trim().slice(0, 80);
    const caption = m[2].trim().slice(0, 160);

    // Try query first, fallback to topic or subject if empty
    let hits = await fetchWikimediaImages(query, 1);
    if (!hits.length && topic) {
      hits = await fetchWikimediaImages(topic, 1);
    }
    if (!hits.length && subject) {
      hits = await fetchWikimediaImages(`${subject} ${topic}`.slice(0, 60), 1);
    }

    if (hits.length) {
      const img = hits[0];
      media.push({ url: img.url, caption, query, title: img.title });
      out = out.replace(m[0], `\n\n![${caption}](${img.url})\n*Figure Reference: ${caption}*\n\n`);
    } else {
      out = out.replace(m[0], `\n> 🖼️ **Figure Reference:** *${caption}*\n`);
    }
    await sleep(120);
  }

  // If model produced no images at all, add a small gallery from topic/subject
  if (media.length === 0) {
    const q = `${subject || ""} ${topic}`.trim().slice(0, 80) || topic;
    const extra = await fetchWikimediaImages(q, 2);
    for (const img of extra) {
      media.push({
        url: img.url,
        caption: img.title,
        query: q,
        title: img.title,
      });
    }
    if (extra.length) {
      const galleryMd =
        `\n\n---\n\n**Visual Reference Gallery**\n\n` +
        extra.map((e) => `![${e.title}](${e.url})\n*${e.title}*`).join("\n\n");
      out = out.trimEnd() + galleryMd;
    }
  }

  return { text: out, media };
}

/** Download image to buffer for PDF embedding (pdfkit needs raster). */
export async function fetchImageBuffer(url) {
  try {
    const r = await fetchWithTimeout(url);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    if (ct.includes("svg")) return null; // pdfkit can't embed svg directly
    const buf = Buffer.from(await r.arrayBuffer());
    if (!buf.length) return null;
    return { buffer: buf, contentType: ct };
  } catch {
    return null;
  }
}
