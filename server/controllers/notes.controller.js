import NotesModel from "../models/notes.models.js";
import UserModel from "../models/user.models.js";
import PDFDocument from "pdfkit";
import { fetchImageBuffer } from "../services/media.services.js";
import { logActivity } from "../utils/logActivity.js";

export const getUserNotes = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    const notes = await NotesModel.find({ user: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ data: notes });
  } catch (error) {
    console.error("Error fetching user notes:", error);
    res.status(500).json({ error: "An error occurred while fetching notes." });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.length !== 24) return res.status(400).json({ error: "Invalid note id." });
    const note = await NotesModel.findOne({ _id: id, user: req.userId });
    if (!note) return res.status(404).json({ error: "Note not found." });
    return res.status(200).json({ data: note });
  } catch (error) {
    console.error("Error fetching note:", error);
    return res.status(500).json({ error: "Failed to fetch note." });
  }
};

// Server-side PDF — no raw HTML leaks to the user. Markdown is rendered as
// styled text; markdown images ![...](url) are fetched and embedded as raster.
// Mermaid and Chart blocks are rendered as text descriptions to avoid broken HTML.
export const downloadNotePdf = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.length !== 24) return res.status(400).json({ error: "Invalid note id." });
    const note = await NotesModel.findOne({ _id: id, user: req.userId });
    if (!note) return res.status(404).json({ error: "Note not found." });

    // Log the PDF export activity
    logActivity({
      userId: req.userId,
      kind: "PDF exported",
      title: `Downloaded ${note.topic || "notes"} as a PDF`,
      detail: note.subject || "",
      credits: 0,
      refId: note._id,
    });

    const safeTopic = (note.topic || "notes").replace(/[^a-zA-Z0-9-_ ]/g, "").trim().slice(0, 60) || "notes";
    const filename = `${safeTopic.replace(/\s+/g, "-")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: { Title: note.topic, Author: "ExaminAI" },
    });
    doc.pipe(res);

    // Header
    doc.fontSize(11).fillColor("#6b7280").text((note.subject || "") + (note.examType ? `  •  ${note.examType}` : ""), { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(22).fillColor("#111827").text(note.topic || "Notes", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor("#9ca3af").text(new Date(note.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }));
    doc.moveDown(0.4);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e5e7eb").lineWidth(1).stroke();
    doc.moveDown(0.8);

    // Pre-collect image URLs from content + media
    const content = String(note.content || "");
    // Never emit raw HTML — strip any that slipped through
    const sanitized = content.replace(/<[^>]*>/g, "");
    // Extract markdown images
    const mdImageRe = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
    const imageEntries = [];
    let m;
    while ((m = mdImageRe.exec(sanitized)) !== null) imageEntries.push({ url: m[2], caption: m[1] || "" });
    // Also include media array that may have extra gallery images not yet in markdown
    for (const med of (note.media || [])) {
      if (!imageEntries.some(e => e.url === med.url)) imageEntries.push({ url: med.url, caption: med.caption || med.title || "" });
    }

    // Build a non-image text for line rendering and a set of image URLs to skip in text
    const textWithoutImages = sanitized.replace(mdImageRe, "").replace(/```mermaid[\s\S]*?```/g, (block) => {
      // For PDF, replace mermaid with a readable placeholder (we don't render mermaid server-side)
      const inner = block.replace(/```mermaid|```/g, "").trim().slice(0, 800);
      return `\n[Diagram: ${inner.split("\n").slice(0, 5).join(" / ").slice(0, 200)}]\n`;
    });

    const lines = textWithoutImages.replace(/\r\n/g, "\n").split("\n");
    const IMAGE_EVERY_N_LINES = 18;
    let linesSinceImage = 0;
    let nextImageIdx = 0;

    function ensureSpace(needed) {
      if (doc.y + needed > 790) doc.addPage();
    }

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (!line.trim()) { doc.moveDown(0.45); linesSinceImage++; continue; }

      // Skip leftover "Chart:" header lines that were already rendered as tables client-side
      // In PDF we just render the row lines as text

      const h1 = line.match(/^#\s+(.*)/);
      const h2 = line.match(/^##\s+(.*)/);
      const h3 = line.match(/^###\s+(.*)/);
      const bullet = line.match(/^[-*]\s+(.*)/);
      const numbered = line.match(/^\d+\.\s+(.*)/);
      const tableRow = line.includes("|") && line.trim().startsWith("|");

      // Strip markdown bold for PDF text
      const stripBold = (s) => s.replace(/\*\*(.+?)\*\*/g, "$1");

      if (h1) {
        doc.moveDown(0.4); doc.fontSize(16).fillColor("#111827").text(stripBold(h1[1]), { align: "left" }); doc.moveDown(0.2);
      } else if (h2) {
        doc.moveDown(0.3); doc.fontSize(13).fillColor("#1f2937").text(stripBold(h2[1]), { align: "left" }); doc.moveDown(0.15);
      } else if (h3) {
        doc.moveDown(0.25); doc.fontSize(11).fillColor("#374151").text(stripBold(h3[1]), { align: "left" }); doc.moveDown(0.1);
      } else if (tableRow) {
        // Render table rows as compact lined text in PDF (full table layout would need a table plugin)
        ensureSpace(14);
        doc.fontSize(9).fillColor("#1f2937").text(stripBold(line.replace(/\|/g, "  ")), { indent: 8, lineGap: 2 }); doc.moveDown(0.08);
      } else if (bullet) {
        ensureSpace(14);
        doc.fontSize(10).fillColor("#1f2937").text(`•  ${stripBold(bullet[1])}`, { indent: 12, align: "left", lineGap: 3 }); doc.moveDown(0.1);
      } else if (numbered) {
        ensureSpace(14);
        doc.fontSize(10).fillColor("#1f2937").text(stripBold(line.trim()), { indent: 12, align: "left", lineGap: 3 }); doc.moveDown(0.1);
      } else {
        ensureSpace(16);
        doc.fontSize(10).fillColor("#1f2937").text(stripBold(line), { align: "left", lineGap: 4 }); doc.moveDown(0.15);
      }
      linesSinceImage++;

      // Interleave images every N lines so they appear near relevant text, not all at end
      if (nextImageIdx < imageEntries.length && linesSinceImage >= IMAGE_EVERY_N_LINES) {
        const entry = imageEntries[nextImageIdx++];
        try {
          const fetched = await fetchImageBuffer(entry.url);
          if (fetched?.buffer) {
            ensureSpace(180);
            const maxW = 470;
            doc.moveDown(0.3);
            try {
              doc.image(fetched.buffer, { fit: [maxW, 260], align: "center" });
            } catch {
              doc.fontSize(8).fillColor("#9ca3af").text(`[Image: ${entry.caption}]`, { align: "center" });
            }
            doc.moveDown(0.15);
            if (entry.caption) {
              doc.fontSize(8).fillColor("#6b7280").text(entry.caption, { align: "center" });
              doc.moveDown(0.25);
            }
          }
        } catch { /* skip failed image, don't break PDF */ }
        linesSinceImage = 0;
      }
    }

    // Any remaining images go at the end as a gallery
    for (; nextImageIdx < imageEntries.length; nextImageIdx++) {
      const entry = imageEntries[nextImageIdx];
      try {
        const fetched = await fetchImageBuffer(entry.url);
        if (fetched?.buffer) {
          ensureSpace(180);
          doc.moveDown(0.3);
          try { doc.image(fetched.buffer, { fit: [470, 260], align: "center" }); }
          catch { doc.fontSize(8).fillColor("#9ca3af").text(`[Image: ${entry.caption}]`, { align: "center" }); }
          doc.moveDown(0.15);
          if (entry.caption) { doc.fontSize(8).fillColor("#6b7280").text(entry.caption, { align: "center" }); doc.moveDown(0.25); }
        }
      } catch {}
    }

    doc.end();
  } catch (error) {
    console.error("PDF generation failed:", error);
    if (!res.headersSent) return res.status(500).json({ error: "Failed to generate PDF." });
    res.end();
  }
};
