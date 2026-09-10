import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    topic: { type: String, required: true },
    message: { type: String, required: true },
    /** Optional: link to a logged-in user if they submitted while authenticated */
    user: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", default: null },
    status: {
      type: String,
      enum: ["new", "read", "replied", "closed"],
      default: "new",
    },
  },
  { timestamps: true }
);

const ContactModel = mongoose.model("ContactModel", contactSchema);
export default ContactModel;
