import fs from "node:fs";
import PDFDocument from "pdfkit";
import { fetchImageBuffer } from "../services/media.services.js";

// ============================================================================
// THEME SYSTEM & ACCESSIBLE COLOR PALETTES (WCAG AA Compliant)
// ============================================================================

export const THEMES = {
  indigo: {
    name: "Modern Indigo",
    accent: "#1e40af", // Blue 800
    accentLight: "#3b82f6", // Blue 500
    tint: "#eff6ff", // Blue 50
    cardBg: "#f8fafc", // Slate 50
    ink: "#0f172a", // Slate 900
    muted: "#64748b", // Slate 500
    line: "#cbd5e1", // Slate 300
    heading1: "#1e3a8a", // Blue 900
    heading2: "#1d4ed8", // Blue 700
    heading3: "#2563eb", // Blue 600
    keyword: "#1e40af",
    callouts: {
      definition: { fill: "#f0fdf4", border: "#16a34a", badgeBg: "#dcfce7", badgeText: "#15803d", ink: "#14532d" },
      example: { fill: "#f5f3ff", border: "#7c3aed", badgeBg: "#ede9fe", badgeText: "#6d28d9", ink: "#3b0764" },
      warning: { fill: "#fff1f2", border: "#e11d48", badgeBg: "#ffe4e6", badgeText: "#be123c", ink: "#881337" },
      quote: { fill: "#f0fdfa", border: "#0d9488", badgeBg: "#ccfbf1", badgeText: "#0f766e", ink: "#134e4a" },
      key: { fill: "#fffbeb", border: "#d97706", badgeBg: "#fef3c7", badgeText: "#b45309", ink: "#78350f" },
      tip: { fill: "#eff6ff", border: "#2563eb", badgeBg: "#dbeafe", badgeText: "#1d4ed8", ink: "#1e3a8a" },
    },
  },
  emerald: {
    name: "Emerald Clean",
    accent: "#047857", // Emerald 700
    accentLight: "#10b981", // Emerald 500
    tint: "#ecfdf5", // Emerald 50
    cardBg: "#f8fafc",
    ink: "#0f172a",
    muted: "#64748b",
    line: "#a7f3d0", // Emerald 200
    heading1: "#064e3b", // Emerald 900
    heading2: "#047857",
    heading3: "#059669",
    keyword: "#047857",
    callouts: {
      definition: { fill: "#ecfdf5", border: "#059669", badgeBg: "#d1fae5", badgeText: "#047857", ink: "#064e3b" },
      example: { fill: "#f5f3ff", border: "#7c3aed", badgeBg: "#ede9fe", badgeText: "#6d28d9", ink: "#3b0764" },
      warning: { fill: "#fff1f2", border: "#e11d48", badgeBg: "#ffe4e6", badgeText: "#be123c", ink: "#881337" },
      quote: { fill: "#f0fdfa", border: "#0d9488", badgeBg: "#ccfbf1", badgeText: "#0f766e", ink: "#134e4a" },
      key: { fill: "#fffbeb", border: "#d97706", badgeBg: "#fef3c7", badgeText: "#b45309", ink: "#78350f" },
      tip: { fill: "#ecfdf5", border: "#059669", badgeBg: "#d1fae5", badgeText: "#047857", ink: "#064e3b" },
    },
  },
  crimson: {
    name: "Editorial Crimson",
    accent: "#991b1b", // Red 800
    accentLight: "#dc2626", // Red 600
    tint: "#fef2f2", // Red 50
    cardBg: "#fafaf9", // Stone 50
    ink: "#1c1917", // Stone 900
    muted: "#78716c", // Stone 500
    line: "#fecaca", // Red 200
    heading1: "#7f1d1d", // Red 900
    heading2: "#991b1b",
    heading3: "#b91c1c",
    keyword: "#991b1b",
    callouts: {
      definition: { fill: "#f0fdf4", border: "#16a34a", badgeBg: "#dcfce7", badgeText: "#15803d", ink: "#14532d" },
      example: { fill: "#f5f3ff", border: "#7c3aed", badgeBg: "#ede9fe", badgeText: "#6d28d9", ink: "#3b0764" },
      warning: { fill: "#fff1f2", border: "#b91c1c", badgeBg: "#fee2e2", badgeText: "#991b1b", ink: "#7f1d1d" },
      quote: { fill: "#fdf2f8", border: "#db2777", badgeBg: "#fce7f3", badgeText: "#be185d", ink: "#831843" },
      key: { fill: "#fffbeb", border: "#d97706", badgeBg: "#fef3c7", badgeText: "#b45309", ink: "#78350f" },
      tip: { fill: "#fef2f2", border: "#991b1b", badgeBg: "#fee2e2", badgeText: "#7f1d1d", ink: "#450a0a" },
    },
  },
  violet: {
    name: "Royal Violet",
    accent: "#6d28d9", // Violet 700
    accentLight: "#8b5cf6", // Violet 500
    tint: "#f5f3ff", // Violet 50
    cardBg: "#f8fafc",
    ink: "#1e1b4b", // Indigo 950
    muted: "#6b7280", // Gray 500
    line: "#ddd6fe", // Violet 200
    heading1: "#4c1d95", // Violet 900
    heading2: "#6d28d9",
    heading3: "#7c3aed",
    keyword: "#6d28d9",
    callouts: {
      definition: { fill: "#f0fdf4", border: "#16a34a", badgeBg: "#dcfce7", badgeText: "#15803d", ink: "#14532d" },
      example: { fill: "#f5f3ff", border: "#7c3aed", badgeBg: "#ede9fe", badgeText: "#6d28d9", ink: "#4c1d95" },
      warning: { fill: "#fff1f2", border: "#e11d48", badgeBg: "#ffe4e6", badgeText: "#be123c", ink: "#881337" },
      quote: { fill: "#f0fdfa", border: "#0d9488", badgeBg: "#ccfbf1", badgeText: "#0f766e", ink: "#134e4a" },
      key: { fill: "#fffbeb", border: "#d97706", badgeBg: "#fef3c7", badgeText: "#b45309", ink: "#78350f" },
      tip: { fill: "#f5f3ff", border: "#6d28d9", badgeBg: "#ede9fe", badgeText: "#5b21b6", ink: "#3b0764" },
    },
  },
  dark: {
    name: "Midnight Dark",
    page: "#0b1120", // Slate 950
    accent: "#38bdf8", // Sky 400
    accentLight: "#7dd3fc",
    tint: "#1e293b", // Slate 800
    cardBg: "#1e293b",
    ink: "#f8fafc", // Slate 50
    muted: "#94a3b8", // Slate 400
    line: "#334155", // Slate 700
    heading1: "#7dd3fc", // Sky 300
    heading2: "#38bdf8",
    heading3: "#a5f3fc",
    keyword: "#fde68a",
    callouts: {
      definition: { fill: "#064e3b", border: "#10b981", badgeBg: "#047857", badgeText: "#d1fae5", ink: "#ecfdf5" },
      example: { fill: "#3b0764", border: "#a855f7", badgeBg: "#581c87", badgeText: "#f3e8ff", ink: "#faf5ff" },
      warning: { fill: "#881337", border: "#fb7185", badgeBg: "#9f1239", badgeText: "#ffe4e6", ink: "#fff1f2" },
      quote: { fill: "#134e4a", border: "#2dd4bf", badgeBg: "#115e59", badgeText: "#ccfbf1", ink: "#f0fdfa" },
      key: { fill: "#78350f", border: "#fbbf24", badgeBg: "#92400e", badgeText: "#fef3c7", ink: "#fffbeb" },
      tip: { fill: "#1e3a8a", border: "#60a5fa", badgeBg: "#1d4ed8", badgeText: "#dbeafe", ink: "#eff6ff" },
    },
  },
  print: {
    name: "Monochrome Print",
    accent: "#111827", // Gray 900
    accentLight: "#374151",
    tint: "#f3f4f6", // Gray 100
    cardBg: "#f9fafb",
    ink: "#000000",
    muted: "#4b5563", // Gray 600
    line: "#d1d5db", // Gray 300
    heading1: "#000000",
    heading2: "#111827",
    heading3: "#1f2937",
    keyword: "#111827",
    callouts: {
      definition: { fill: "#f3f4f6", border: "#111827", badgeBg: "#e5e7eb", badgeText: "#111827", ink: "#000000" },
      example: { fill: "#f3f4f6", border: "#374151", badgeBg: "#e5e7eb", badgeText: "#111827", ink: "#000000" },
      warning: { fill: "#f3f4f6", border: "#000000", badgeBg: "#e5e7eb", badgeText: "#000000", ink: "#000000" },
      quote: { fill: "#f3f4f6", border: "#4b5563", badgeBg: "#e5e7eb", badgeText: "#111827", ink: "#000000" },
      key: { fill: "#f3f4f6", border: "#1f2937", badgeBg: "#e5e7eb", badgeText: "#111827", ink: "#000000" },
      tip: { fill: "#f3f4f6", border: "#374151", badgeBg: "#e5e7eb", badgeText: "#111827", ink: "#000000" },
    },
  },
  sketchbook: {
    name: "Handwritten Sketchbook",
    isSketchbook: true,
    page: "#faf7f0", // Warm cream/parchment notebook paper
    accent: "#ea580c", // Bold terracotta/orange highlighter
    accentLight: "#f97316",
    tint: "#fef3c7", // Sticky note warm yellow
    cardBg: "#ffffff",
    ink: "#1c1917", // Charcoal fountain-pen ink
    muted: "#57534e", // Soft graphite pencil
    line: "#ece8de", // Ruled notebook lines
    heading1: "#0c0a09", // Deep bold ink
    heading2: "#1c1917",
    heading3: "#292524",
    keyword: "#c2410c",
    callouts: {
      definition: { fill: "#fefce8", border: "#ca8a04", badgeBg: "#fef08a", badgeText: "#854d0e", ink: "#713f12" },
      example: { fill: "#f0fdf4", border: "#16a34a", badgeBg: "#bbf7d0", badgeText: "#15803d", ink: "#14532d" },
      warning: { fill: "#fff1f2", border: "#e11d48", badgeBg: "#fecdd3", badgeText: "#9f1239", ink: "#881337" },
      quote: { fill: "#f0f9ff", border: "#0284c7", badgeBg: "#bae6fd", badgeText: "#0369a1", ink: "#0c4a6e" },
      key: { fill: "#fffbeb", border: "#d97706", badgeBg: "#fde68a", badgeText: "#b45309", ink: "#78350f" },
      tip: { fill: "#fafaf9", border: "#57534e", badgeBg: "#e7e5e4", badgeText: "#1c1917", ink: "#1c1917" },
    },
  },
};

// Aliases for backward compatibility
THEMES.minimal = THEMES.indigo;
THEMES.colorful = THEMES.violet;

const PAGE_SIZES = { A4: "A4", Letter: "LETTER", letter: "LETTER" };
const ORIENTATIONS = new Set(["portrait", "landscape"]);
const COVER_STYLES = new Set(["auto", "cover", "banner"]);

// ============================================================================
// CHARACTER SANITIZATION & WINANSI CONVERSION
// ============================================================================

const CP1252_EXTRA = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030,
  0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022,
  0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

function isWinAnsi(cp) {
  return (
    cp === 0x09 || // tab
    cp === 0x0a || // newline
    (cp >= 0x20 && cp <= 0x7e) || // ASCII printable
    (cp >= 0xa0 && cp <= 0xff) || // Latin-1 supplement
    CP1252_EXTRA.has(cp)
  );
}

const SYMBOL_MAP = [
  [/[↔⇔]/g, "<->"],
  [/[→⇒➡➔⟶➜➝➞➤➥]/g, "->"],
  [/[←⇐⟵⬅]/g, "<-"],
  [/[↑⬆]/g, "^"],
  [/[↓⬇]/g, "v"],
  [/≥/g, ">="],
  [/≤/g, "<="],
  [/≠/g, "!="],
  [/[≈≅≃]/g, "~"],
  [/∞/g, "infinity"],
  [/√/g, "sqrt"],
  [/∴/g, "therefore"],
  [/∵/g, "because"],
  [/∑/g, "Sum"],
  [/∏/g, "Product"],
  [/[Δ∆]/g, "Delta"],
  [/δ/g, "delta"],
  [/α/g, "alpha"],
  [/β/g, "beta"],
  [/γ/g, "gamma"],
  [/θ/g, "theta"],
  [/λ/g, "lambda"],
  [/μ/g, "mu"],
  [/π/g, "pi"],
  [/ρ/g, "rho"],
  [/σ/g, "sigma"],
  [/Σ/g, "Sigma"],
  [/τ/g, "tau"],
  [/φ/g, "phi"],
  [/ω/g, "omega"],
  [/Ω/g, "Omega"],
  [/□/g, "[ ]"],
  [/[▪●■‣⁃∙•·]/g, "-"],
  [/[★☆✦✧]/g, ""],
  [/[◆◇]/g, ""],
  [/[✓✔]/g, "[x]"],
  [/[✗✘✕✖]/g, "[ ]"],
  [/[✎✏]/g, ""],
  [/[📌📍📎]/g, ""],
  [/[—–]/g, "-"],
  [/[“”]/g, '"'],
  [/[‘’]/g, "'"],
];

const EMOJI_RE = /[☀-➿⬀-⯿\u{1f000}-\u{1faff}\u{fe00}-\u{fe0f}\u{20e3}]\x20?/gu;

export function toWinAnsi(value) {
  let s = String(value || "");
  for (const [re, rep] of SYMBOL_MAP) s = s.replace(re, rep);
  s = s.replace(EMOJI_RE, "");
  try {
    s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  } catch {}
  // Filter out any leftover mojibake or characters outside standard printable ASCII
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp === 0x09 || cp === 0x0a || (cp >= 0x20 && cp <= 0x7e)) {
      out += ch;
    }
  }
  return out;
}

export function safeText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return toWinAnsi(value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")).trim();
}

function stripMarkdown(value) {
  return safeText(value)
    .replace(/[*_~`]/g, "")
    .replace(/^>\s?/, "");
}

// ============================================================================
// PDF CONFIGURATION OPTIONS
// ============================================================================

export function readPdfOptions(query = {}, env = process.env, note = null) {
  const pageSize = PAGE_SIZES[query.pageSize] || "A4";
  const orientation = ORIENTATIONS.has(query.orientation)
    ? query.orientation
    : "portrait";

  const isHandwritten =
    query.template === "sketchbook" ||
    query.noteStyle === "handwritten" ||
    note?.noteStyle === "handwritten" ||
    Boolean(
      note?.content &&
      /Welcome to my personal revision notes|HANDWRITTEN NOTE STYLE|✍️|omniscient topper/i.test(
        note.content,
      ),
    );

  const defaultTemplate = isHandwritten ? "sketchbook" : "indigo";
  const template = THEMES[query.template] ? query.template : defaultTemplate;
  const coverStyle = COVER_STYLES.has(query.coverStyle)
    ? query.coverStyle
    : "auto";
  const margins = Math.max(28, Math.min(90, Number(query.margins) || 45));

  return {
    pageSize,
    orientation,
    template,
    coverStyle,
    margins,
    version: safeText(query.version || env.EXAMINAI_PDF_VERSION, "1.0"),
    author: safeText(query.author || env.EXAMINAI_PDF_AUTHOR, "ExaminAI"),
    organization: safeText(
      query.organization || env.EXAMINAI_PDF_ORGANIZATION,
      isHandwritten ? "ExaminAI Visual Handbook" : "ExaminAI Academic Suite",
    ),
    logoPath: safeText(env.EXAMINAI_PDF_LOGO, ""),
  };
}

// ============================================================================
// MARKDOWN PARSER
// ============================================================================

function calloutTone(value) {
  const match = String(value).match(
    /^\s*>?\s*\[?(DEFINITION|EXAMPLE|WARNING|QUOTE|KEY POINT|KEY TAKEAWAY|EXAM ALERT|TIP|PRO TIP)\]?/i,
  );
  if (!match) return null;
  const raw = match[1].toUpperCase();
  if (raw.includes("DEFINITION")) return "definition";
  if (raw.includes("EXAMPLE")) return "example";
  if (raw.includes("WARNING") || raw.includes("ALERT")) return "warning";
  if (raw.includes("QUOTE")) return "quote";
  if (raw.includes("KEY")) return "key";
  if (raw.includes("TIP")) return "tip";
  return "key";
}

function removeCalloutLabel(value) {
  return String(value).replace(
    /^\s*>?\s*\[?(DEFINITION|EXAMPLE|WARNING|QUOTE|KEY POINT|KEY TAKEAWAY|EXAM ALERT|TIP|PRO TIP)\]?\s*[:-]?\s*/i,
    "",
  );
}

export function parseMarkdown(content) {
  const lines = safeText(content)
    .replace(/<[^>]*>/g, "")
    .replace(/\r\n/g, "\n")
    .split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    // Code block
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index++]);
      }
      index += 1;
      blocks.push({ kind: "code", language, text: code.join("\n") });
      continue;
    }

    // Mermaid diagram block
    if (/^\s*(?:flowchart|graph)\s+(?:TB|TD|BT|RL|LR)\b/i.test(line)) {
      const diagram = [line];
      index += 1;
      while (
        index < lines.length &&
        /^\s*(?:[A-Za-z0-9_]+\s*\[[^\]]+\](?::\:\:[\w-]+)?\s*(?:[-=]+>)(?:\|[^|]*\|)?\s*[A-Za-z0-9_]+\s*\[[^\]]+\](?::\:\:[\w-]+)?|classDef\s+|class\s+|subgraph\s+|end\b)/i.test(
          lines[index],
        )
      ) {
        diagram.push(lines[index++]);
      }
      blocks.push({
        kind: "code",
        language: "mermaid",
        text: diagram.join("\n"),
      });
      continue;
    }

    // Markdown image
    const image = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^)]+)\)$/);
    if (image) {
      blocks.push({ kind: "image", alt: image[1], url: image[2] });
      index += 1;
      continue;
    }

    // Headings
    const heading = line.match(/^(#{1,3})\s+(.+)/);
    if (heading) {
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        text: stripMarkdown(heading[2]),
      });
      index += 1;
      continue;
    }

    // Blockquote / Callout
    if (/^\s*>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quote.push(stripMarkdown(lines[index++]));
      }
      blocks.push({ kind: "callout", text: quote.join(" ") });
      continue;
    }

    // Checklist / Todo
    if (/^\s*[-*]\s+\[[ xX]\]\s+/.test(line)) {
      const todos = [];
      while (
        index < lines.length &&
        /^\s*[-*]\s+\[[ xX]\]\s+/.test(lines[index])
      ) {
        const checked = /^\s*[-*]\s+\[[xX]\]\s+/.test(lines[index]);
        const label = lines[index].replace(/^\s*[-*]\s+\[[ xX]\]\s+/, "");
        todos.push({ checked, text: stripMarkdown(label) });
        index += 1;
      }
      blocks.push({ kind: "todo", items: todos });
      continue;
    }

    // Bullet / Numbered Lists
    if (
      /^\s*(?:[-*+]|\d+\.)\s+/.test(line) &&
      !/^\s*[-*]\s+\[[ xX]\]\s+/.test(line)
    ) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (
        index < lines.length &&
        /^\s*(?:[-*+]|\d+\.)\s+/.test(lines[index]) &&
        !/^\s*[-*]\s+\[[ xX]\]\s+/.test(lines[index])
      ) {
        items.push(
          stripMarkdown(lines[index++].replace(/^\s*(?:[-*+]|\d+\.)\s+/, "")),
        );
      }
      if (items.length) {
        blocks.push({ kind: "list", ordered, items });
        continue;
      }
    }

    // Tables
    if (
      line.includes("|") &&
      index + 1 < lines.length &&
      lines[index + 1].includes("|")
    ) {
      const rows = [];
      while (index < lines.length && lines[index].includes("|")) {
        const row = lines[index++]
          .split("|")
          .map((cell) => stripMarkdown(cell))
          .filter(Boolean);
        if (row.length && !row.every((cell) => /^[-:]+$/.test(cell))) {
          rows.push(row);
        }
      }
      if (rows.length) {
        blocks.push({ kind: "table", rows });
        continue;
      }
    }

    // Horizontal Rule
    if (/^\s*[-*_]{3,}\s*$/.test(line)) {
      blocks.push({ kind: "divider" });
      index += 1;
      continue;
    }

    // Regular Paragraph
    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s|^```|^\s*>\s?|^\s*(?:[-*+]|\d+\.)\s+|^!\[[^\]]*\]\(https?:\/\/|^\s*[-*_]{3,}\s*$/.test(
        lines[index],
      )
    ) {
      paragraph.push(lines[index++]);
    }
    blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function deriveGlossary(blocks) {
  const terms = new Map();
  for (const block of blocks) {
    if (block.kind !== "paragraph") continue;
    const match = block.text.match(/\*\*([^*]+)\*\*\s*[:—-]\s*(.+)/);
    if (match) terms.set(stripMarkdown(match[1]), stripMarkdown(match[2]));
  }
  return [...terms.entries()].slice(0, 20);
}

// ============================================================================
// PDF DRAWING HELPERS
// ============================================================================

function drawBadge(doc, text, x, y, { fill, textColor, fontSize = 7.5, paddingX = 7, paddingY = 3 }) {
  const clean = safeText(text);
  doc.font("Helvetica-Bold").fontSize(fontSize);
  const w = doc.widthOfString(clean) + paddingX * 2;
  const h = fontSize + paddingY * 2 + 1;
  doc
    .save()
    .roundedRect(x, y, w, h, 3)
    .fill(fill)
    .restore();
  doc
    .fillColor(textColor)
    .text(clean, x + paddingX, y + paddingY, { lineBreak: false });
  return { width: w, height: h };
}

function drawSpiralBinding(doc, pageHeight) {
  const holeX = 14;
  const holeW = 9;
  const holeH = 5.2;
  const spacing = 20;
  const startY = 24;
  const endY = pageHeight - 24;

  doc.save();
  for (let y = startY; y < endY; y += spacing) {
    // Hole punched depth shadow
    doc.roundedRect(holeX - 0.5, y + 0.5, holeW + 1, holeH + 1, 2.5).fill("#d6d3d1");
    // Hole punch cutout
    doc.roundedRect(holeX, y, holeW, holeH, 2.5).fill("#292524");

    // Double metallic spiral wire loop
    // Ring 1 (base wire)
    doc.lineWidth(1.4).strokeColor("#78716c");
    doc.moveTo(2, y + 1.5).bezierCurveTo(8, y - 2, holeX + 2, y, holeX + 6, y + 2).stroke();
    // Highlight reflection
    doc.lineWidth(0.6).strokeColor("#f5f5f4");
    doc.moveTo(3, y + 1.5).bezierCurveTo(8, y - 1, holeX + 2, y + 0.5, holeX + 5, y + 1.5).stroke();

    // Ring 2 (double wire loop effect)
    doc.lineWidth(1.2).strokeColor("#a8a29e");
    doc.moveTo(2, y + 3.5).bezierCurveTo(8, y + 0.5, holeX + 2, y + 2, holeX + 6, y + 4).stroke();
  }
  doc.restore();
}

function drawNotebookLines(doc, pageWidth, pageHeight, contentLeft, contentRight) {
  doc.save();
  // Faint ruled notebook horizontal lines
  doc.strokeColor("#eee9dd").lineWidth(0.5);
  const startY = 56;
  const endY = pageHeight - 34;
  for (let y = startY; y < endY; y += 22) {
    doc.moveTo(contentLeft - 4, y).lineTo(pageWidth - contentRight + 4, y).stroke();
  }
  // Notebook vertical margin guide line (classic stationery red margin)
  doc.strokeColor("#fca5a5").lineWidth(0.75);
  doc.moveTo(contentLeft - 8, 25).lineTo(contentLeft - 8, pageHeight - 20).stroke();
  doc.restore();
}

function addSketchbookCover(doc, note, options, theme) {
  const { left, right, top, bottom } = doc.page.margins;
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - left - right;

  // Background cream paper & spiral binding
  doc.rect(0, 0, pageWidth, pageHeight).fill(theme.page || "#faf7f0");
  drawSpiralBinding(doc, pageHeight);
  drawNotebookLines(doc, pageWidth, pageHeight, left, right);

  // Top sticker badge
  let curY = top - 8;
  const badge1 = drawBadge(doc, "VISUAL REVISION HANDBOOK", left, curY, {
    fill: theme.accent,
    textColor: "#ffffff",
    fontSize: 8,
    paddingX: 8,
    paddingY: 3.5,
  });

  const domainLabel = (note.domain || "ENGINEERING").toUpperCase();
  drawBadge(doc, domainLabel, left + badge1.width + 8, curY, {
    fill: "#ffffff",
    textColor: theme.ink,
    fontSize: 8,
    paddingX: 7,
    paddingY: 3.5,
  });

  // Main Handbook Title
  curY += 34;
  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor(theme.ink)
    .text(safeText(note.topic || "Visual Handbook"), left, curY, {
      width: contentWidth,
      lineGap: 4,
    });

  // Hand-drawn marker highlight stroke under title
  const titleHeight = doc.heightOfString(safeText(note.topic || "Visual Handbook"), { width: contentWidth, lineGap: 4 });
  const highlightY = curY + titleHeight + 4;
  doc
    .save()
    .strokeColor(theme.accentLight || "#f97316")
    .lineWidth(4)
    .lineCap("round")
    .moveTo(left, highlightY)
    .lineTo(left + Math.min(contentWidth, 240), highlightY)
    .stroke()
    .restore();

  // Subtitle / Series tagline
  curY = highlightY + 14;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(theme.muted)
    .text("A comprehensive, visual, bite-sized study handbook & conceptual cheatsheet.", left, curY, {
      width: contentWidth,
    });

  // Blueprint Card 1: What's Inside / Chapter Blueprint
  curY += 28;
  const card1Height = 110;
  doc
    .save()
    .roundedRect(left + 2, curY + 2, contentWidth, card1Height, 6)
    .fill("#e7e5e4"); // drop shadow
  doc
    .roundedRect(left, curY, contentWidth, card1Height, 6)
    .fillAndStroke("#ffffff", "#d6d3d1")
    .restore();

  // Washi tape sticker at top of Card 1
  doc
    .save()
    .roundedRect(left + contentWidth / 2 - 30, curY - 5, 60, 10, 2)
    .fillOpacity(0.5)
    .fill("#e2e8f0")
    .restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(theme.accent)
    .text("HANDBOOK BLUEPRINT & SYLLABUS", left + 14, curY + 12);

  const blueprintPoints = [
    { num: "01", text: "Core Concepts, Definitions & First Principles" },
    { num: "02", text: "Architecture, Flowcharts & System Mechanisms" },
    { num: "03", text: "Critical Exam Alerts, Traps & Active Recall" },
    { num: "04", text: "High-Yield Summary & Glossary Cheatsheet" },
  ];

  blueprintPoints.forEach((pt, idx) => {
    const py = curY + 34 + idx * 17;
    drawBadge(doc, pt.num, left + 14, py - 1, {
      fill: theme.tint,
      textColor: theme.accent,
      fontSize: 7.5,
      paddingX: 4,
      paddingY: 1.5,
    });
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(theme.ink)
      .text(pt.text, left + 40, py, { width: contentWidth - 55, lineBreak: false });
  });

  // Blueprint Card 2: Metadata & Quick Specs
  curY += card1Height + 16;
  const card2Height = 84;
  doc
    .save()
    .roundedRect(left + 2, curY + 2, contentWidth, card2Height, 6)
    .fill("#e7e5e4");
  doc
    .roundedRect(left, curY, contentWidth, card2Height, 6)
    .fillAndStroke("#ffffff", "#d6d3d1")
    .restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(theme.ink)
    .text("QUICK REVISION SPECS", left + 14, curY + 12);

  const colW = (contentWidth - 28) / 4;
  const metaItems = [
    { label: "MODULE TYPE", val: safeText(note.moduleType || "Standard").toUpperCase() },
    { label: "AUDIENCE", val: safeText(note.audienceLevel || "Intermediate").toUpperCase() },
    { label: "TOTAL WORDS", val: `${note.actualWordCount || 0} WORDS` },
    { label: "TARGET EXAM", val: safeText(note.examType || "General").toUpperCase() },
  ];

  metaItems.forEach((item, i) => {
    const cx = left + 14 + i * colW;
    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor(theme.muted)
      .text(item.label, cx, curY + 32, { width: colW - 8 });
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(theme.accent)
      .text(item.val, cx, curY + 46, { width: colW - 8 });
  });

  // Bottom Takeaway Slogan Banner
  const footerY = pageHeight - bottom - 26;
  doc
    .save()
    .roundedRect(left, footerY, contentWidth, 28, 5)
    .fillAndStroke(theme.tint, theme.accent)
    .restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(theme.ink)
    .text("Master the Core  |  Clear the Clutter  |  Ace the Exam", left, footerY + 9, {
      width: contentWidth,
      align: "center",
      lineBreak: false,
    });

  doc.addPage();
}

function addExecutiveCover(doc, note, options, theme) {
  const { left, right, top, bottom } = doc.page.margins;
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - left - right;

  doc.rect(0, 0, pageWidth, pageHeight).fill(theme.tint);

  const bannerHeight = 160;
  doc.save();
  doc.rect(0, 0, pageWidth, bannerHeight).fill(theme.accent);
  doc
    .polygon([0, bannerHeight - 12], [pageWidth, bannerHeight - 42], [pageWidth, bannerHeight], [0, bannerHeight])
    .fill(theme.accentLight || theme.accent);
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#ffffff")
    .text(
      (options.organization || "EXAMINAI | ACADEMIC BRIEF").toUpperCase(),
      left,
      40,
      { characterSpacing: 2 },
    );

  let badgeY = bannerHeight + 35;
  const domainText = (note.domain || "ACADEMIC").toUpperCase();
  const subjectText = (note.subject || "REVISION GUIDE").toUpperCase();

  const domainBadge = drawBadge(doc, domainText, left, badgeY, {
    fill: theme.accent,
    textColor: "#ffffff",
    fontSize: 8.5,
  });

  drawBadge(doc, subjectText, left + domainBadge.width + 8, badgeY, {
    fill: theme.cardBg,
    textColor: theme.ink,
    fontSize: 8.5,
  });

  const titleY = badgeY + 30;
  doc
    .font("Helvetica-Bold")
    .fontSize(28)
    .fillColor(theme.ink)
    .text(safeText(note.topic || "Study Notes"), left, titleY, {
      width: contentWidth,
      lineGap: 4,
    });

  doc.moveDown(0.6);
  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor(theme.muted)
    .text("Comprehensive structured revision guide with learning outcomes & analysis.", {
      width: contentWidth,
      lineGap: 3,
    });

  const cardY = doc.y + 24;
  const cardHeight = 78;
  doc
    .save()
    .roundedRect(left, cardY, contentWidth, cardHeight, 6)
    .fillAndStroke(theme.cardBg, theme.line)
    .restore();

  const colW = contentWidth / 4;
  const metaItems = [
    { label: "MODULE TYPE", val: safeText(note.moduleType || "Standard Module").toUpperCase() },
    { label: "AUDIENCE", val: safeText(note.audienceLevel || "Intermediate").toUpperCase() },
    { label: "WORD COUNT", val: `${note.actualWordCount || (note.content ? note.content.split(/\s+/).filter(Boolean).length : 0)} WORDS` },
    { label: "TARGET EXAM", val: safeText(note.examType || "General Exam").toUpperCase() },
  ];

  metaItems.forEach((item, i) => {
    const cx = left + i * colW + 12;
    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(theme.muted)
      .text(item.label, cx, cardY + 16, { width: colW - 16, characterSpacing: 0.5 });
    doc
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .fillColor(theme.ink)
      .text(item.val, cx, cardY + 34, { width: colW - 16 });
  });

  const footerY = pageHeight - bottom - 30;
  doc
    .save()
    .strokeColor(theme.line)
    .lineWidth(0.75)
    .moveTo(left, footerY)
    .lineTo(pageWidth - right, footerY)
    .stroke()
    .restore();

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(theme.muted)
    .text(`Author: ${options.author}   |   Version: ${options.version}`, left, footerY + 10, {
      width: contentWidth / 2,
    });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(theme.muted)
    .text(
      new Date(note.createdAt || Date.now()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      left + contentWidth / 2,
      footerY + 10,
      { width: contentWidth / 2, align: "right" },
    );

  doc.addPage();
}

function addHeroBanner(doc, note, options, theme) {
  const { left, right, top } = doc.page.margins;
  const contentWidth = doc.page.width - left - right;

  const bannerHeight = 85;
  const startY = top;

  if (theme.isSketchbook) {
    // Drop shadow
    doc
      .save()
      .roundedRect(left + 2, startY + 2, contentWidth, bannerHeight, 6)
      .fill("#e7e5e4");
    doc
      .roundedRect(left, startY, contentWidth, bannerHeight, 6)
      .fillAndStroke("#ffffff", theme.accent)
      .restore();

    // Washi tape sticker
    doc
      .save()
      .roundedRect(left + contentWidth / 2 - 25, startY - 4, 50, 8, 1.5)
      .fillOpacity(0.5)
      .fill("#e2e8f0")
      .restore();

    const domainText = (note.domain || "ACADEMIC").toUpperCase();
    const badge = drawBadge(doc, "VISUAL SUMMARY", left + 14, startY + 12, {
      fill: theme.accent,
      textColor: "#ffffff",
      fontSize: 7.5,
    });
    drawBadge(doc, domainText, left + 14 + badge.width + 6, startY + 12, {
      fill: theme.tint,
      textColor: theme.accent,
      fontSize: 7.5,
    });

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(theme.ink)
      .text(safeText(note.topic || "Study Notes"), left + 14, startY + 32, {
        width: contentWidth - 28,
        lineGap: 2,
      });

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(theme.muted)
      .text(
        `@${options.author || "ExaminAI"} Notes  |  ${note.moduleType || "Summary"}  |  ${new Date(note.createdAt || Date.now()).toLocaleDateString()}`,
        left + 14,
        startY + 62,
        { width: contentWidth - 28 },
      );

    doc.y = startY + bannerHeight + 18;
    return;
  }

  doc
    .save()
    .roundedRect(left, startY, contentWidth, bannerHeight, 6)
    .fill(theme.tint)
    .restore();

  doc
    .save()
    .roundedRect(left, startY, 4.5, bannerHeight, 2)
    .fill(theme.accent)
    .restore();

  const domainText = (note.domain || "ACADEMIC").toUpperCase();
  const subjectText = (note.subject || "NOTES").toUpperCase();
  const badge = drawBadge(doc, domainText, left + 16, startY + 12, {
    fill: theme.accent,
    textColor: "#ffffff",
    fontSize: 7.5,
  });
  drawBadge(doc, subjectText, left + 16 + badge.width + 6, startY + 12, {
    fill: theme.cardBg,
    textColor: theme.ink,
    fontSize: 7.5,
  });

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(theme.ink)
    .text(safeText(note.topic || "Study Notes"), left + 16, startY + 32, {
      width: contentWidth - 32,
      lineGap: 2,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(theme.muted)
    .text(
      `${options.organization || "ExaminAI"}  |  ${note.moduleType || "Summary"}  |  ${new Date(note.createdAt || Date.now()).toLocaleDateString()}`,
      left + 16,
      startY + 62,
      { width: contentWidth - 32 },
    );

  doc.y = startY + bannerHeight + 18;
}

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================

export async function generateNotePdf(res, note, rawOptions = {}) {
  const options = { ...readPdfOptions(rawOptions, process.env, note), ...rawOptions };
  const theme = THEMES[options.template] || (note?.noteStyle === "handwritten" ? THEMES.sketchbook : THEMES.indigo);
  const blocks = parseMarkdown(note.content);
  const headings = blocks.filter((b) => b.kind === "heading" && b.level <= 2);
  const glossary = deriveGlossary(blocks);

  const isShortNote =
    note.moduleType === "quick-summary" ||
    (note.actualWordCount && note.actualWordCount < 900) ||
    headings.length <= 2;
  const useFullCover =
    options.coverStyle === "cover" ||
    (options.coverStyle === "auto" && !isShortNote);

  const isSketchbook = Boolean(theme.isSketchbook);
  const leftMargin = options.margins + (isSketchbook ? 22 : 0);
  const rightMargin = options.margins;
  const topMargin = options.margins + 20;
  const bottomMargin = options.margins + 20;

  const doc = new PDFDocument({
    bufferPages: true,
    size: options.pageSize,
    layout: options.orientation,
    margins: {
      top: topMargin,
      bottom: bottomMargin,
      left: leftMargin,
      right: rightMargin,
    },
    info: {
      Title: safeText(note.topic || "Notes"),
      Author: options.author,
      Subject: safeText(note.subject || "Educational Notes"),
      Keywords: "ExaminAI, Study Notes, Revision Guide",
      Creator: "ExaminAI Advanced PDF Engine",
    },
  });

  doc.pipe(res);

  const { left, right, top, bottom } = doc.page.margins;
  const contentWidth = doc.page.width - left - right;
  const pageHeight = doc.page.height;
  const maxContentY = pageHeight - bottom - 10;

  const fillPageBackground = () => {
    if (theme.page) {
      doc.save().rect(0, 0, doc.page.width, doc.page.height).fill(theme.page).restore();
    }
    if (theme.isSketchbook) {
      drawSpiralBinding(doc, doc.page.height);
      drawNotebookLines(doc, doc.page.width, doc.page.height, left, right);
    }
  };

  if (useFullCover) {
    if (theme.isSketchbook) {
      addSketchbookCover(doc, note, options, theme);
    } else {
      addExecutiveCover(doc, note, options, theme);
    }
    fillPageBackground();
  } else {
    fillPageBackground();
    addHeroBanner(doc, note, options, theme);
  }

  const ensureSpace = (neededHeight) => {
    if (doc.y + neededHeight > maxContentY) {
      doc.addPage();
      fillPageBackground();
      doc.y = top;
    }
  };

  if (useFullCover && headings.length >= 3) {
    ensureSpace(120);
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(theme.heading1)
      .text("Table of Contents", left, doc.y);
    doc.moveDown(0.5);

    headings.forEach((h, idx) => {
      ensureSpace(22);
      const isSub = h.level === 2;
      const indent = isSub ? 16 : 0;
      const label = `${idx + 1}.  ${h.text}`;
      const yPos = doc.y;

      doc
        .font(isSub ? "Helvetica" : "Helvetica-Bold")
        .fontSize(isSub ? 9.5 : 10.5)
        .fillColor(isSub ? theme.muted : theme.ink)
        .text(label, left + indent, yPos, { width: contentWidth - indent });

      const textWidth = doc.widthOfString(label) + 8;
      const startDot = left + indent + textWidth;
      const endDot = left + contentWidth;
      if (endDot > startDot + 30) {
        doc
          .save()
          .strokeColor(theme.line)
          .lineWidth(0.5)
          .dash(1, { space: 3 })
          .moveTo(startDot, yPos + (isSub ? 6 : 7))
          .lineTo(endDot, yPos + (isSub ? 6 : 7))
          .stroke()
          .restore();
      }

      doc.moveDown(0.3);
    });

    doc.moveDown(1.2);
  }

  const writeParagraph = (text) => {
    ensureSpace(32);
    const body = safeText(text)
      .replace(/~~([^~]+)~~/g, "$1")
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1");

    const parts = body.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
    doc.fontSize(9.8);

    parts.forEach((part, index) => {
      const isBold = /^\*\*(.+)\*\*$/.test(part);
      const isCode = /^`(.+)`$/.test(part);
      const clean = part.replace(/^(\*\*|`)|(\*\*|`)$/g, "");

      if (isCode) {
        doc.font("Courier").fillColor(theme.heading2);
      } else if (isBold) {
        doc.font("Helvetica-Bold").fillColor(theme.keyword || theme.accent);
      } else {
        doc.font("Helvetica").fillColor(theme.ink);
      }

      doc.text(clean, {
        width: contentWidth,
        lineGap: 3.5,
        continued: index < parts.length - 1,
      });
    });

    doc.moveDown(0.4);
  };

  const drawCalloutCard = (text, toneKey = "tip") => {
    const tone = theme.callouts[toneKey] || theme.callouts.tip;
    const body = safeText(text);
    if (!body) return;

    const padding = 12;
    const innerWidth = contentWidth - padding * 2 - 4;
    const badgeLabel = toneKey.toUpperCase().replace("-", " ");

    doc.font("Helvetica").fontSize(9.5);
    const textHeight = doc.heightOfString(body, { width: innerWidth, lineGap: 3 });
    const totalHeight = textHeight + padding * 2 + 18;

    ensureSpace(totalHeight + 12);
    const boxTop = doc.y;

    if (theme.isSketchbook) {
      // Soft drop shadow
      doc.save().roundedRect(left + 2, boxTop + 2, contentWidth, totalHeight, 5).fill("#e7e5e4").restore();
      // Sticky note background
      doc.save().roundedRect(left, boxTop, contentWidth, totalHeight, 5).fill(tone.fill).restore();
      // Dashed hand-drawn outline
      doc.save().roundedRect(left, boxTop, contentWidth, totalHeight, 5).dash(3, { space: 3 }).strokeColor(tone.border).lineWidth(1).stroke().restore();
      // Translucent washi tape sticker at top
      doc.save().roundedRect(left + contentWidth / 2 - 25, boxTop - 4, 50, 8, 1.5).fillOpacity(0.45).fill("#d6d3d1").restore();

      drawBadge(doc, badgeLabel, left + 12, boxTop + 10, {
        fill: tone.badgeBg,
        textColor: tone.badgeText,
        fontSize: 7.5,
        paddingX: 6,
        paddingY: 2.5,
      });

      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(tone.ink)
        .text(body, left + 12, boxTop + 28, {
          width: innerWidth,
          lineGap: 3,
        });

      doc.y = boxTop + totalHeight;
      doc.moveDown(0.5);
      doc.font("Helvetica").fillColor(theme.ink);
      return;
    }

    doc
      .save()
      .roundedRect(left, boxTop, contentWidth, totalHeight, 5)
      .fill(tone.fill)
      .restore();

    doc
      .save()
      .roundedRect(left, boxTop, 4, totalHeight, 2)
      .fill(tone.border)
      .restore();

    drawBadge(doc, badgeLabel, left + 12, boxTop + 10, {
      fill: tone.badgeBg,
      textColor: tone.badgeText,
      fontSize: 7.5,
      paddingX: 6,
      paddingY: 2.5,
    });

    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(tone.ink)
      .text(body, left + 12, boxTop + 28, {
        width: innerWidth,
        lineGap: 3,
      });

    doc.y = boxTop + totalHeight;
    doc.moveDown(0.5);
    doc.font("Helvetica").fillColor(theme.ink);
  };

  const drawTable = (rows) => {
    if (!rows || !rows.length) return;
    ensureSpace(60);

    const numCols = Math.max(...rows.map((r) => r.length));
    if (!numCols) return;

    const colWeights = new Array(numCols).fill(1);
    rows.forEach((row) => {
      row.forEach((cell, ci) => {
        colWeights[ci] = Math.max(colWeights[ci], String(cell).length);
      });
    });

    const totalWeight = colWeights.reduce((acc, w) => acc + w, 0);
    const colWidths = colWeights.map((w) =>
      Math.max(45, (w / totalWeight) * contentWidth),
    );

    const sumWidths = colWidths.reduce((a, b) => a + b, 0);
    const normalizedWidths = colWidths.map((w) => (w / sumWidths) * contentWidth);

    const cellPaddingH = 7;
    const cellPaddingV = 6;

    rows.forEach((row, rowIndex) => {
      const isHeader = rowIndex === 0;
      const font = isHeader ? "Helvetica-Bold" : "Helvetica";
      const fontSize = isHeader ? 9 : 8.5;
      doc.font(font).fontSize(fontSize);

      let maxCellHeight = 14;
      normalizedWidths.forEach((cw, ci) => {
        const text = row[ci] || "";
        const h = doc.heightOfString(text, { width: cw - cellPaddingH * 2 });
        if (h > maxCellHeight) maxCellHeight = h;
      });

      const rowHeight = maxCellHeight + cellPaddingV * 2;
      ensureSpace(rowHeight);

      const rowTop = doc.y;
      let curX = left;

      normalizedWidths.forEach((cw, ci) => {
        const text = row[ci] || "";
        const bgFill = isHeader
          ? theme.accent
          : rowIndex % 2 === 1
            ? theme.cardBg
            : "#ffffff";

        doc
          .save()
          .rect(curX, rowTop, cw, rowHeight)
          .fillAndStroke(bgFill, theme.line)
          .restore();

        doc
          .font(font)
          .fontSize(fontSize)
          .fillColor(isHeader ? "#ffffff" : theme.ink)
          .text(text, curX + cellPaddingH, rowTop + cellPaddingV, {
            width: cw - cellPaddingH * 2,
            lineGap: 2,
          });

        curX += cw;
      });

      doc.y = rowTop + rowHeight;
    });

    doc.moveDown(0.6);
    doc.font("Helvetica").fillColor(theme.ink);
  };

  const drawTodoList = (items) => {
    items.forEach((item) => {
      ensureSpace(24);
      const itemY = doc.y;
      const boxSize = 11;
      const boxX = left + 2;

      doc
        .save()
        .roundedRect(boxX, itemY + 1, boxSize, boxSize, 2.5)
        .strokeColor(item.checked ? theme.accent : theme.muted)
        .lineWidth(1)
        .stroke()
        .restore();

      if (item.checked) {
        doc
          .save()
          .roundedRect(boxX, itemY + 1, boxSize, boxSize, 2.5)
          .fill(theme.accent)
          .strokeColor("#ffffff")
          .lineWidth(1.2)
          .moveTo(boxX + 2.5, itemY + 6.5)
          .lineTo(boxX + 5, itemY + 9)
          .lineTo(boxX + 8.5, itemY + 3.5)
          .stroke()
          .restore();
      }

      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(item.checked ? theme.muted : theme.ink)
        .text(item.text, left + 22, itemY, {
          width: contentWidth - 24,
          lineGap: 2,
        });

      doc.moveDown(0.25);
    });
    doc.moveDown(0.3);
  };

  const drawList = (items, ordered) => {
    items.forEach((item, i) => {
      ensureSpace(22);
      const itemY = doc.y;
      const marker = ordered ? `${i + 1}.` : "-";

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(theme.accent)
        .text(marker, left + 4, itemY, { width: 16 });

      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(theme.ink)
        .text(safeText(item), left + 22, itemY, {
          width: contentWidth - 24,
          lineGap: 2.5,
        });

      doc.moveDown(0.25);
    });
    doc.moveDown(0.3);
  };

  const drawCodeBlock = (code, language = "") => {
    const body = safeText(code);
    if (!body) return;

    const padding = 10;
    const innerWidth = contentWidth - padding * 2;
    doc.font("Courier").fontSize(8.5);
    const textHeight = doc.heightOfString(body, { width: innerWidth, lineGap: 2.5 });
    const blockHeight = textHeight + padding * 2 + (language ? 16 : 10);

    ensureSpace(Math.min(blockHeight, 220));
    const topPos = doc.y;

    if (theme.isSketchbook) {
      doc.save().roundedRect(left + 2, topPos + 2, contentWidth, blockHeight, 6).fill("#e7e5e4").restore();
    }

    doc
      .save()
      .roundedRect(left, topPos, contentWidth, blockHeight, 5)
      .fill("#0f172a")
      .restore();

    // Terminal mac-style control dots
    doc.save();
    doc.circle(left + 12, topPos + 9, 3).fill("#ef4444");
    doc.circle(left + 22, topPos + 9, 3).fill("#eab308");
    doc.circle(left + 32, topPos + 9, 3).fill("#22c55e");
    doc.restore();

    if (language) {
      drawBadge(doc, language.toUpperCase(), left + contentWidth - 65, topPos + 5, {
        fill: "#334155",
        textColor: "#94a3b8",
        fontSize: 7,
      });
    }

    doc
      .font("Courier")
      .fontSize(8.5)
      .fillColor("#e2e8f0")
      .text(body, left + padding, topPos + padding + 12, {
        width: innerWidth,
        lineGap: 2.5,
      });

    doc.y = topPos + blockHeight;
    doc.moveDown(0.5);
    doc.font("Helvetica").fillColor(theme.ink);
  };

  const drawMermaidDiagram = (source) => {
    const rawNodes = [];
    const lines = source.split("\n");

    for (const l of lines) {
      for (const m of l.matchAll(/([A-Za-z0-9_]+)\s*\[([^\]]+)\]/g)) {
        if (!rawNodes.some((n) => n.id === m[1])) {
          rawNodes.push({ id: m[1], label: safeText(m[2]) });
        }
      }
    }

    if (!rawNodes.length) {
      drawCodeBlock(source, "flowchart");
      return;
    }

    const nodes = rawNodes.slice(0, 8);
    const boxHeight = 28;
    const boxWidth = Math.min(130, Math.max(90, (contentWidth - 40) / Math.min(nodes.length, 4)));
    const gap = 16;

    const cols = nodes.length <= 4 ? nodes.length : 3;
    const rows = Math.ceil(nodes.length / cols);
    const diagramHeight = rows * (boxHeight + gap + 10);

    ensureSpace(diagramHeight + 20);
    const diagramTop = doc.y;

    nodes.forEach((node, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const nx = left + col * (boxWidth + gap);
      const ny = diagramTop + row * (boxHeight + gap + 10);

      doc
        .save()
        .roundedRect(nx, ny, boxWidth, boxHeight, 4)
        .fillAndStroke(theme.tint, theme.accent)
        .restore();

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(theme.ink)
        .text(node.label, nx + 4, ny + 9, {
          width: boxWidth - 8,
          align: "center",
        });

      if (col < cols - 1 && idx < nodes.length - 1) {
        const arrowX1 = nx + boxWidth + 2;
        const arrowX2 = nx + boxWidth + gap - 4;
        const arrowY = ny + boxHeight / 2;

        doc
          .save()
          .strokeColor(theme.accent)
          .lineWidth(1)
          .moveTo(arrowX1, arrowY)
          .lineTo(arrowX2, arrowY)
          .stroke()
          .restore();

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(theme.accent)
          .text(">", arrowX2 - 4, arrowY - 4.5);
      }
    });

    doc.y = diagramTop + diagramHeight;
    doc.moveDown(0.5);
    doc.font("Helvetica").fillColor(theme.ink);
  };

  const drawImageBlock = async (block) => {
    const imgData = await fetchImageBuffer(block.url);
    if (!imgData) {
      writeParagraph(block.alt || "Image illustration.");
      return;
    }

    ensureSpace(200);
    const imgTop = doc.y;

    try {
      doc.image(imgData.buffer, left, imgTop, {
        fit: [contentWidth, 220],
        align: "center",
      });

      doc.y = imgTop + 225;
      if (block.alt) {
        doc
          .font("Helvetica-Oblique")
          .fontSize(8)
          .fillColor(theme.muted)
          .text(`Figure: ${safeText(block.alt)}`, left, doc.y, {
            width: contentWidth,
            align: "center",
          });
      }
      doc.moveDown(0.6).font("Helvetica").fillColor(theme.ink);
    } catch {
      writeParagraph(block.alt || "Image illustration.");
    }
  };

  let sectionNumber = 0;

  for (const block of blocks) {
    if (block.kind === "heading") {
      if (block.level === 1) {
        sectionNumber += 1;
        ensureSpace(95);
        doc.moveDown(0.8);

        const headingY = doc.y;
        const numStr = String(sectionNumber).padStart(2, "0");

        if (theme.isSketchbook) {
          const badge = drawBadge(doc, numStr, left, headingY + 2, {
            fill: theme.accent,
            textColor: "#ffffff",
            fontSize: 9.5,
            paddingX: 6,
            paddingY: 2.5,
          });

          doc
            .font("Helvetica-Bold")
            .fontSize(15)
            .fillColor(theme.heading1)
            .text(block.text.toUpperCase(), left + badge.width + 8, headingY + 2, {
              width: contentWidth - badge.width - 10,
            });

          doc.moveDown(0.3);
          const strokeY = doc.y;
          doc
            .save()
            .strokeColor(theme.accentLight || "#f97316")
            .lineWidth(2.5)
            .lineCap("round")
            .moveTo(left, strokeY)
            .lineTo(left + Math.min(contentWidth, 180), strokeY)
            .stroke()
            .restore();

          doc.moveDown(0.35);
        } else {
          doc
            .save()
            .roundedRect(left, headingY + 1, 4, 20, 2)
            .fill(theme.accent)
            .restore();

          doc
            .font("Helvetica-Bold")
            .fontSize(16)
            .fillColor(theme.heading1)
            .text(`${sectionNumber}.  ${block.text}`, left + 12, headingY, {
              width: contentWidth - 14,
            });

          doc.moveDown(0.3);
          doc
            .save()
            .strokeColor(theme.line)
            .lineWidth(0.5)
            .moveTo(left, doc.y)
            .lineTo(left + contentWidth, doc.y)
            .stroke()
            .restore();

          doc.moveDown(0.4);
        }
      } else if (block.level === 2) {
        ensureSpace(75);
        doc.moveDown(0.5);

        const prefix = theme.isSketchbook ? "->  " : "";
        doc
          .font("Helvetica-Bold")
          .fontSize(12.5)
          .fillColor(theme.heading2)
          .text(`${prefix}${block.text}`, left, doc.y, { width: contentWidth });

        doc.moveDown(0.25);
      } else {
        ensureSpace(50);
        doc.moveDown(0.35);

        const prefix = "";
        doc
          .font("Helvetica-Bold")
          .fontSize(10.5)
          .fillColor(theme.heading3)
          .text(`${prefix}${block.text}`, left, doc.y, { width: contentWidth });

        doc.moveDown(0.2);
      }
    } else if (block.kind === "paragraph") {
      if (/^\*\*(?:Key Point|Tip|Warning|Important|Exam Alert|Takeaway)/i.test(block.text)) {
        drawCalloutCard(stripMarkdown(block.text), "key");
      } else {
        writeParagraph(block.text);
      }
    } else if (block.kind === "callout") {
      const tone = calloutTone(block.text) || "tip";
      drawCalloutCard(removeCalloutLabel(block.text), tone);
    } else if (block.kind === "list") {
      drawList(block.items, block.ordered);
    } else if (block.kind === "todo") {
      drawTodoList(block.items);
    } else if (block.kind === "table") {
      drawTable(block.rows);
    } else if (block.kind === "code") {
      if (block.language.toLowerCase() === "mermaid") {
        drawMermaidDiagram(block.text);
      } else {
        drawCodeBlock(block.text, block.language);
      }
    } else if (block.kind === "image") {
      await drawImageBlock(block);
    } else if (block.kind === "divider") {
      ensureSpace(16);
      doc
        .save()
        .strokeColor(theme.line)
        .lineWidth(0.5)
        .moveTo(left, doc.y + 4)
        .lineTo(left + contentWidth, doc.y + 4)
        .stroke()
        .restore();
      doc.moveDown(0.5);
    }
  }

  if (glossary.length) {
    ensureSpace(100);
    doc.moveDown(0.8);
    doc
      .font("Helvetica-Bold")
      .fontSize(15)
      .fillColor(theme.heading1)
      .text("Glossary & Key Terminology", left, doc.y);

    doc.moveDown(0.4);

    glossary.forEach(([term, def]) => {
      ensureSpace(28);
      const termY = doc.y;

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(theme.accent)
        .text(term, left + 4, termY, { continued: true })
        .font("Helvetica")
        .fillColor(theme.ink)
        .text(`  -  ${def}`, { width: contentWidth - 6, lineGap: 2.5 });

      doc.moveDown(0.25);
    });
  }

  // ==========================================================================
  // TWO-PASS POST PROCESSING: RUNNING HEADERS & FOOTERS (Page X of Y)
  // ==========================================================================
  const range = doc.bufferedPageRange();
  const totalPages = range.count;

  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);

    const isCover = useFullCover && i === 0;
    if (isCover) {
      continue;
    }

    // Temporarily zero margins and disable line breaks so PDFKit never triggers auto-pagination
    const origTop = doc.page.margins.top;
    const origBottom = doc.page.margins.bottom;
    doc.page.margins.top = 0;
    doc.page.margins.bottom = 0;

    const headerY = top - 14;
    const footerY = pageHeight - bottom + 6;

    if (theme.isSketchbook) {
      // Running Header: Left @handle & topic, Right [PAGE 0X] rounded pill badge
      doc
        .save()
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(theme.muted)
        .text(`@${safeText(options.author || "ExaminAI")} Notes`, left, headerY, {
          width: contentWidth - 85,
          lineBreak: false,
        });

      const pageBadge = `PAGE ${String(i + 1).padStart(2, "0")}`;
      drawBadge(doc, pageBadge, left + contentWidth - 55, headerY - 2, {
        fill: theme.ink,
        textColor: "#ffffff",
        fontSize: 7,
        paddingX: 5,
        paddingY: 2,
      });

      doc
        .strokeColor("#e7e5e4")
        .lineWidth(0.5)
        .moveTo(left, headerY + 12)
        .lineTo(left + contentWidth, headerY + 12)
        .stroke()
        .restore();

      // Running Footer: Star takeaway slogan banner
      doc
        .save()
        .strokeColor("#e7e5e4")
        .lineWidth(0.5)
        .moveTo(left, footerY - 5)
        .lineTo(left + contentWidth, footerY - 5)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(theme.muted)
        .text(
          "Visual Revision Handbook | Conceptual Architecture & High Yield Retention",
          left,
          footerY,
          {
            width: contentWidth,
            align: "center",
            lineBreak: false,
          },
        )
        .restore();
    } else {
      // Running Header
      doc
        .save()
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(theme.muted)
        .text(safeText(note.topic || "ExaminAI Notes"), left, headerY, {
          width: contentWidth - 100,
          lineBreak: false,
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(theme.accent)
        .text(
          safeText(note.subject || "EXAMINAI").toUpperCase(),
          left + contentWidth - 100,
          headerY,
          {
            width: 100,
            align: "right",
            lineBreak: false,
          },
        );

      doc
        .strokeColor(theme.line)
        .lineWidth(0.5)
        .moveTo(left, headerY + 11)
        .lineTo(left + contentWidth, headerY + 11)
        .stroke()
        .restore();

      // Running Footer
      doc
        .save()
        .strokeColor(theme.line)
        .lineWidth(0.5)
        .moveTo(left, footerY - 5)
        .lineTo(left + contentWidth, footerY - 5)
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(theme.muted)
        .text(options.organization || options.author, left, footerY, {
          width: contentWidth / 2,
          lineBreak: false,
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(theme.ink)
        .text(
          `Page ${i + 1} of ${totalPages}`,
          left + contentWidth / 2,
          footerY,
          {
            width: contentWidth / 2,
            align: "right",
            lineBreak: false,
          },
        )
        .restore();
    }

    // Restore margins
    doc.page.margins.top = origTop;
    doc.page.margins.bottom = origBottom;
  }

  doc.end();
}
