import mongoose from "mongoose";

const orgSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "campus"],
      default: "free",
    },
    creditPool: {
      type: Number,
      default: 0,
      min: 0,
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const OrgModel = mongoose.model("OrgModel", orgSchema);

export default OrgModel;
