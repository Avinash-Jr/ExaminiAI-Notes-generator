import express from "express";
import isAuth from "../middleware/isAuth.js";
import { upload, handleMulterError } from "../middleware/upload.js";
import { generateNotes } from "../controllers/generate.controller.js";

const notesRouter = express.Router();

// isAuth is required — this route spends credits and writes to the database.
// upload.array("files", 5) accepts up to 5 PDF/image files.
notesRouter.post(
  "/generate-notes",
  isAuth,
  upload.array("files", 5),
  handleMulterError,
  generateNotes
);

export default notesRouter;
