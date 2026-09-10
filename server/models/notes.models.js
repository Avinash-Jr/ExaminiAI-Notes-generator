import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: String,
    query: String,
    title: String,
  },
  { _id: false }
);

const notesSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", required: true },
    topic: { type: String, required: true },
    subject: String,
    examType: String,
    format: String,
    revisionMode: { type: Boolean, default: false },
    includeDiagrams: Boolean,
    includeCharts: Boolean,
    content: { type: String, required: true },
    // Real images resolved for the note — used by PDF and client gallery fallback
    media: { type: [mediaSchema], default: [] },
  },
  { timestamps: true }
);

const NotesModel = mongoose.model("NotesModel", notesSchema);
export default NotesModel;
