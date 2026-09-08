import express from "express";
import isAuth from "../middleware/isAuth.js";
import { getUserNotes, getNoteById, downloadNotePdf } from "../controllers/notes.controller.js";

const notesRouter = express.Router();

notesRouter.get("/my-notes", isAuth, getUserNotes);
notesRouter.get("/:id", isAuth, getNoteById);
notesRouter.get("/:id/pdf", isAuth, downloadNotePdf);

export default notesRouter;
