import express from "express"
import { generateNotes } from "../controllers/generate.controller";

const Notesrouter = express.Router();


Notesrouter.post("/generate-notes", isAuth, generateNotes);

export default Notesrouter
 
