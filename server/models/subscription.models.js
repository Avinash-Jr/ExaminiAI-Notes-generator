import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrgModel",
      default: null,
    },
    planId: {
      type: String,
      enum: ["starter", "popular", "pro", "monthly_pro", "annual_pro"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "trialing", "past_due", "canceled"],
      default: "active",
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const SubscriptionModel = mongoose.model("SubscriptionModel", subscriptionSchema);

export default SubscriptionModel;
