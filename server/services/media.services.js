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
 */
export async function fetchWikimediaImages(q, limit = 3) {
  const key = `${q}::${limit}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.urls;

  try {
    // 1) search file namespace
    const searchUrl = `${WIKI_SEARCH}?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=${limit * 2}&format=json${WIKI_ORIGIN}`;
    const sr = await fetchWithTimeout(searchUrl);
    if (!sr.ok) return [];
    const sj = await sr.json();
    const titles = (sj?.query?.search || []).map(s => s.title).filter(Boolean).slice(0, limit * 2);
    if (!titles.length) return [];

    // 2) resolve to imageinfo
    const titlesParam = titles.map(t => encodeURIComponent(t)).join("|");
    const infoUrl = `${WIKI_SEARCH}?action=query&titles=${titlesParam}&prop=imageinfo&iiprop=url|mime&format=json${WIKI_ORIGIN}`;
    const ir = await fetchWithTimeout(infoUrl);
    if (!ir.ok) return [];
    const ij = await ir.json();
    const pages = Object.values(ij?.query?.pages || {});
    const urls = [];
    for (const p of pages) {
      const info = p?.imageinfo?.[0];
      const url = info?.url || "";
      const mime = info?.mime || "";
      if (!url) continue;
      if (!/^https:\/\//.test(url)) continue;
      if (mime && !/image\/(jpeg|png|webp|svg\+xml)/.test(mime)) continue;
      // prefer raster for pdfkit (svg needs conversion); keep svg for web but limit
      urls.push({ url, title: p.title?.replace(/^File:/, "") || q, mime });
      if (urls.length >= limit) break;
    }
    cache.set(key, { urls, at: Date.now() });
    return urls;
  } catch (e) {
    console.warn("fetchWikimediaImages failed for", q, e.message);
    return [];
  }
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
    const hits = await fetchWikimediaImages(query || topic, 1);
    if (hits.length) {
      const img = hits[0];
      media.push({ url: img.url, caption, query, title: img.title });
      // Replace marker with standard markdown image — client renders as real <img>
      out = out.replace(m[0], `![${caption}](${img.url})`);
    } else {
      // No image found — replace marker with just the caption (no broken HTML)
      out = out.replace(m[0], `*${caption}*`);
    }
    // Be nice to Wikimedia
    await sleep(120);
  }

  // If model produced no images at all, add a small gallery from topic/subject
  if (media.length === 0) {
    const q = `${subject || ""} ${topic}`.trim().slice(0, 80) || topic;
    const extra = await fetchWikimediaImages(q, 2);
    for (const img of extra) {
      media.push({ url: img.url, caption: img.title, query: q, title: img.title });
    }
    // Append gallery as markdown images at end of Quick Revision if we found any
    if (extra.length) {
      const galleryMd = `\n\n---\n\n**Illustrations**\n\n` + extra.map(e => `![${e.title}](${e.url})`).join("\n\n");
      // Only append if Quick Revision exists, otherwise at end
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
