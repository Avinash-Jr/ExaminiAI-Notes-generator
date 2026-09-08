import express from "express";
import isAuth from "../middleware/isAuth.js";
import { generateNotes } from "../controllers/generate.controller.js";

const notesRouter = express.Router();

// isAuth is required — this route spends credits and writes to the database
notesRouter.post("/generate-notes", isAuth, generateNotes);

export default notesRouter;
