import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true,
    },
    kind: {
      type: String,
      required: true,
      enum: [
        "Signed in",
        "Notes generated",
        "PDF exported",
        "Credits purchased",
        "Note deleted",
        "Diagram created",
        "Settings changed",
      ],
    },
    title: { type: String, required: true },
    detail: { type: String, default: "" },
    credits: { type: Number, default: 0 },
    /** Optional ref back to the note or payment that caused this event */
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

// TTL index — automatically remove entries older than 365 days
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const ActivityModel = mongoose.model("ActivityModel", activitySchema);
export default ActivityModel;
