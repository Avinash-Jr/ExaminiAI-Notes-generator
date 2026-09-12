import { PDFParse } from "pdf-parse";

const MAX_TEXT_LENGTH = 24000;
const PDF_HEADER = Buffer.from("%PDF-");

function extractionError(code, message, fileName) {
  const error = new Error(message);
  error.code = code;
  error.fileName = fileName;
  error.statusCode = 422;
  return error;
}

function classifyPdfError(error, fileName) {
  const message = String(error?.message || "").toLowerCase();
  if (/password|encrypted|protected|security/.test(message)) {
    return extractionError(
      "PDF_PASSWORD_PROTECTED",
      `PDF "${fileName}" is password-protected or restricted. Upload an unlocked PDF.`,
      fileName,
    );
  }
  return extractionError(
    "PDF_UNREADABLE",
    `PDF "${fileName}" is unreadable or corrupted. Upload a valid PDF and try again.`,
    fileName,
  );
}

function validatePdfFile(file) {
  const fileName = file.originalname || "upload.pdf";
  if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw extractionError("PDF_EMPTY", `PDF "${fileName}" is empty.`, fileName);
  }
  if (!file.buffer.subarray(0, PDF_HEADER.length).equals(PDF_HEADER)) {
    throw extractionError(
      "PDF_INVALID_SIGNATURE",
      `PDF "${fileName}" is not a readable PDF file.`,
      fileName,
    );
  }
}

export async function extractReferenceMaterials(files) {
  const pdfFiles = (files || []).filter(
    (file) => file.mimetype === "application/pdf",
  );
  const nonPdfFiles = (files || []).filter(
    (file) => file.mimetype !== "application/pdf",
  );

  if (!files?.length) {
    return {
      text: "",
      mode: "direct",
      status: "NO_REFERENCES",
      files: [],
      warnings: [],
    };
  }

  if (nonPdfFiles.length) {
    const names = nonPdfFiles
      .map((file) => file.originalname || "upload")
      .join(", ");
    throw extractionError(
      "UNSUPPORTED_REFERENCE_FORMAT",
      `Unsupported reference format: ${names}. Upload PDF files only.`,
      names,
    );
  }

  const parts = [];
  const filesInfo = [];
  for (const file of pdfFiles) {
    const name = file.originalname || "upload.pdf";
    validatePdfFile(file);
    const parser = new PDFParse({ data: file.buffer });
    try {
      const result = await parser.getText();
      const text = (result.text || "").replace(/\s+/g, " ").trim();
      if (!text) {
        throw extractionError(
          "PDF_EMPTY_CONTENT",
          `PDF "${name}" contains no extractable text. It may be scanned, empty, or image-only.`,
          name,
        );
      }
      parts.push(`--- Reference PDF: ${name} ---\n${text}`);
      filesInfo.push({
        name,
        pages: result.total || null,
        characters: text.length,
      });
    } catch (error) {
      if (error.code) throw error;
      throw classifyPdfError(error, name);
    } finally {
      await parser.destroy();
    }
  }

  const text = parts.join("\n\n").slice(0, MAX_TEXT_LENGTH);
  return {
    text,
    mode: "reference",
    status: "REFERENCES_VALID",
    files: filesInfo,
    warnings:
      text.length >= MAX_TEXT_LENGTH
        ? ["Reference text was limited to 10,000 characters."]
        : [],
  };
}

/**
 * Extracts text from uploaded files (PDF and images).
 * PDFs: uses pdf-parse to pull the text content.
 * Images: adds a placeholder note since we can't OCR on the server.
 *
 * Returns a single string combining all extracted content.
 */
export async function extractTextFromFiles(files) {
  const result = await extractReferenceMaterials(files);
  return result.text;
}
