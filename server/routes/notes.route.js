import express from "express";
import isAuth from "../middleware/isAuth.js";
import { getUserNotes, getNoteById, downloadNotePdf, exportNote } from "../controllers/notes.controller.js";

const notesRouter = express.Router();

notesRouter.get("/my-notes", isAuth, getUserNotes);
notesRouter.get("/:id", isAuth, getNoteById);
notesRouter.get("/:id/pdf", isAuth, downloadNotePdf);
notesRouter.get("/:id/export", isAuth, exportNote);

export default notesRouter;
