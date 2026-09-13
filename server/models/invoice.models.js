import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
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
    orderId: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    creditsAdded: {
      type: Number,
      default: 0,
    },
    planName: {
      type: String,
      default: "Credit Pack",
    },
    status: {
      type: String,
      enum: ["paid", "pending", "failed"],
      default: "paid",
    },
  },
  { timestamps: true }
);

const InvoiceModel = mongoose.model("InvoiceModel", invoiceSchema);

export default InvoiceModel;
