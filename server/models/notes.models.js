import mongoose from "mongoose";

const notesSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserModel",
            required: true,
        },
        topic: {
            type: String,
            required: true,
        },
        subject: String,
        examType: String,
        format: String,
        revisionMode: {
            type: Boolean,
            default: false,
        },
        includeDiagrams: Boolean,
        includeCharts: Boolean,
        content: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const NotesModel = mongoose.model("NotesModel", notesSchema);

export default NotesModel;
