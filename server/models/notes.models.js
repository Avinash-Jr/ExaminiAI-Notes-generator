import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: String,
    query: String,
    title: String,
  },
  { _id: false },
);

const notesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    topic: { type: String, required: true },
    subject: String,
    domain: {
      type: String,
      enum: [
        "stem",
        "humanities",
        "business",
        "social-sciences",
        "arts",
        "medicine",
        "law",
        "general",
      ],
      default: "general",
    },
    learningObjectives: { type: [String], default: [] },
    audienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "intermediate",
    },
    prerequisites: { type: [String], default: [] },
    examplePreference: {
      type: String,
      enum: ["theoretical", "applied", "balanced", "case-studies"],
      default: "balanced",
    },
    depthLevel: {
      type: String,
      enum: ["intuitive", "rigorous", "deep-technical"],
      default: "rigorous",
    },
    customInstructions: { type: String, default: "" },
    moduleType: {
      type: String,
      enum: ["quick-summary", "standard", "comprehensive", "custom"],
      default: "standard",
    },
    targetWordCount: { type: Number, default: 2000 },
    targetSectionCount: { type: Number, default: 6 },
    actualWordCount: { type: Number, default: 0 },
    examType: String,
    format: String,
    noteStyle: {
      type: String,
      enum: ["academic", "handwritten"],
      default: "academic",
    },
    revisionMode: { type: Boolean, default: false },
    includeDiagrams: Boolean,
    includeCharts: Boolean,
    content: { type: String, required: true },
    toc: {
      type: [
        {
          title: String,
          level: Number,
          anchor: String,
        },
      ],
      default: [],
    },
    glossary: {
      type: [
        {
          term: String,
          definition: String,
          domainContext: String,
        },
      ],
      default: [],
    },
    qaReport: {
      readability: {
        fleschKincaidGrade: Number,
        fleschReadingEase: Number,
        smogIndex: Number,
        audienceMatch: Boolean,
        assessment: String,
        gradeLabel: String,
      },
      logicalFlow: {
        score: Number,
        transitionsVerified: Boolean,
        transitionNotes: [String],
      },
      fieldAdherence: {
        score: Number,
        fieldsChecked: mongoose.Schema.Types.Mixed,
        coverageGaps: [String],
        adherenceSummary: String,
      },
      sectionConfidence: [
        {
          sectionTitle: String,
          score: Number,
          rationale: String,
        },
      ],
      overallConfidenceScore: Number,
    },
    metadataSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    exportFormats: {
      markdown: String,
      html: String,
      latex: String,
      plainText: String,
    },
    generationMode: {
      type: String,
      enum: ["reference", "direct"],
      default: "direct",
    },
    referenceStatus: { type: String, default: "NO_REFERENCES" },
    referenceFiles: {
      type: [
        {
          name: String,
          pages: Number,
          characters: Number,
        },
      ],
      default: [],
    },
    // Real images resolved for the note — used by PDF and client gallery fallback
    media: { type: [mediaSchema], default: [] },
  },
  { timestamps: true },
);

const NotesModel = mongoose.model("NotesModel", notesSchema);
export default NotesModel;
