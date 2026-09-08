import NotesModel from "../models/notes.models.js";
import UserModel from "../models/user.models.js";
import PDFDocument from "pdfkit";

export const getUserNotes = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
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
    if (!id || id.length !== 24) {
      return res.status(400).json({ error: "Invalid note id." });
    }
    const note = await NotesModel.findOne({ _id: id, user: req.userId });
    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }
    return res.status(200).json({ data: note });
  } catch (error) {
    console.error("Error fetching note:", error);
    return res.status(500).json({ error: "Failed to fetch note." });
  }
};

// Server-side PDF generation — preserves structure without requiring client libs
export const downloadNotePdf = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.length !== 24) {
      return res.status(400).json({ error: "Invalid note id." });
    }
    const note = await NotesModel.findOne({ _id: id, user: req.userId });
    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

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

    // Content — render markdown-like text cleanly without HTML injection
    const content = note.content || "";
    // Strip any HTML tags that might have slipped in and normalize
    const plain = content.replace(/<[^>]*>/g, "").replace(/\r\n/g, "\n");

    // Simple structured rendering: split by lines, handle headings
    const lines = plain.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (!line.trim()) {
        doc.moveDown(0.5);
        continue;
      }
      // Markdown headings
      const h1 = line.match(/^#\s+(.*)/);
      const h2 = line.match(/^##\s+(.*)/);
      const h3 = line.match(/^###\s+(.*)/);
      const bullet = line.match(/^[-*]\s+(.*)/);
      const numbered = line.match(/^\d+\.\s+(.*)/);

      if (h1) {
        doc.moveDown(0.4);
        doc.fontSize(16).fillColor("#111827").text(h1[1], { align: "left" });
        doc.moveDown(0.2);
      } else if (h2) {
        doc.moveDown(0.3);
        doc.fontSize(13).fillColor("#1f2937").text(h2[1], { align: "left" });
        doc.moveDown(0.15);
      } else if (h3) {
        doc.moveDown(0.25);
        doc.fontSize(11).fillColor("#374151").text(h3[1], { align: "left" });
        doc.moveDown(0.1);
      } else if (bullet) {
        doc.fontSize(10).fillColor("#1f2937").text(`•  ${bullet[1]}`, { indent: 12, align: "left", lineGap: 3 });
        doc.moveDown(0.1);
      } else if (numbered) {
        doc.fontSize(10).fillColor("#1f2937").text(line.trim(), { indent: 12, align: "left", lineGap: 3 });
        doc.moveDown(0.1);
      } else {
        doc.fontSize(10).fillColor("#1f2937").text(line, { align: "left", lineGap: 4 });
        doc.moveDown(0.15);
      }

      // Page overflow handled by pdfkit auto-pagination
    }

    doc.end();
  } catch (error) {
    console.error("PDF generation failed:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to generate PDF." });
    }
    res.end();
  }
};
