import NotesModel from "../models/notes.models.js";
import UserModel from "../models/user.models.js";
import { PassThrough } from "node:stream";
import { generateNotePdf, readPdfOptions } from "../utils/pdfGenerator.js";
import { logActivity } from "../utils/logActivity.js";
import { generateAllFormats } from "../utils/exportFormats.js";

export const getUserNotes = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    const notes = await NotesModel.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ data: notes });
  } catch (error) {
    console.error("Error fetching user notes:", error);
    res.status(500).json({ error: "An error occurred while fetching notes." });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.length !== 24)
      return res.status(400).json({ error: "Invalid note id." });
    const note = await NotesModel.findOne({ _id: id, user: req.userId });
    if (!note) return res.status(404).json({ error: "Note not found." });
    return res.status(200).json({ data: note });
  } catch (error) {
    console.error("Error fetching note:", error);
    return res.status(500).json({ error: "Failed to fetch note." });
  }
};

export const downloadNotePdf = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.length !== 24)
      return res.status(400).json({ error: "Invalid note id." });
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

    const safeTopic =
      (note.topic || "notes")
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .slice(0, 60) || "notes";
    const filename = `${safeTopic.replace(/\s+/g, "-")}.pdf`;

    // Render into memory first. Streaming PDFKit directly into an Express
    // response can leave a valid-looking but empty download when the client
    // closes or reuses the response before PDFKit finishes its final chunk.
    const pdfStream = new PassThrough();
    const chunks = [];
    const pdfReady = new Promise((resolve, reject) => {
      pdfStream.on("data", (chunk) => chunks.push(chunk));
      pdfStream.once("end", resolve);
      pdfStream.once("error", reject);
    });
    await generateNotePdf(pdfStream, note, readPdfOptions(req.query, process.env, note));
    await pdfReady;
    const pdf = Buffer.concat(chunks);
    if (!pdf.length)
      throw new Error("PDF renderer returned an empty document.");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", String(pdf.length));
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");
    res.end(pdf);
  } catch (error) {
    console.error("PDF generation failed:", error);
    if (!res.headersSent)
      return res.status(500).json({ error: "Failed to generate PDF." });
    res.end();
  }
};

export const exportNote = async (req, res) => {
  try {
    const { id } = req.params;
    const format = String(req.query.format || "markdown").toLowerCase();

    if (!id || id.length !== 24)
      return res.status(400).json({ error: "Invalid note id." });
    const note = await NotesModel.findOne({ _id: id, user: req.userId });
    if (!note) return res.status(404).json({ error: "Note not found." });

    if (format === "pdf") {
      return downloadNotePdf(req, res);
    }

    const safeTopic =
      (note.topic || "notes")
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .slice(0, 60) || "notes";
    const slug = safeTopic.replace(/\s+/g, "-");

    // Check pre-generated export formats or generate on the fly
    let bundles = note.exportFormats;
    if (
      !bundles ||
      !bundles.markdown ||
      !bundles.html ||
      !bundles.latex ||
      !bundles.plainText
    ) {
      bundles = generateAllFormats(note.content, {
        topic: note.topic,
        subject: note.subject,
        toc: note.toc || [],
        moduleType: note.moduleType || "standard",
        actualWordCount: note.actualWordCount || 0,
      });
      // Cache asynchronously
      NotesModel.findByIdAndUpdate(note._id, { exportFormats: bundles }).exec();
    }

    logActivity({
      userId: req.userId,
      kind: "PDF exported",
      title: `Exported ${note.topic} as ${format.toUpperCase()}`,
      detail: `${note.subject || ""}${note.subject ? " - " : ""}${format.toUpperCase()} export`,
      credits: 0,
      refId: note._id,
    });

    if (format === "html") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${slug}.html"`,
      );
      return res.send(bundles.html);
    } else if (format === "latex" || format === "tex") {
      res.setHeader("Content-Type", "text/x-tex; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${slug}.tex"`,
      );
      return res.send(bundles.latex);
    } else if (format === "text" || format === "txt") {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${slug}.txt"`,
      );
      return res.send(bundles.plainText);
    } else {
      // Default markdown
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${slug}.md"`);
      return res.send(bundles.markdown || note.content);
    }
  } catch (error) {
    console.error("Export failed:", error);
    if (!res.headersSent)
      return res.status(500).json({ error: "Failed to export notes." });
    res.end();
  }
};
