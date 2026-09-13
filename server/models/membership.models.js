import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrgModel",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member", "viewer"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["active", "invited", "suspended"],
      default: "active",
    },
    invitedEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

membershipSchema.index({ orgId: 1, userId: 1 }, { unique: true });

const MembershipModel = mongoose.model("MembershipModel", membershipSchema);

export default MembershipModel;
