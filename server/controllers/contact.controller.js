import ContactModel from "../models/contact.models.js";

/**
 * POST /api/contact
 * Stores a contact-form submission in MongoDB.
 * Body: { name, email, topic, message }
 */
export const submitContact = async (req, res) => {
  try {
    const { name, email, topic, message } = req.body || {};

    // Server-side validation (mirrors the client checks)
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required." });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email is required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return res.status(400).json({ error: "Invalid email address." });
    }
    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "Topic is required." });
    }
    if (!message || message.trim().length < 15) {
      return res.status(400).json({ error: "Message must be at least 15 characters." });
    }

    const contact = await ContactModel.create({
      name: name.trim(),
      email: email.trim(),
      topic: topic.trim(),
      message: message.trim(),
      // If the user happens to be authenticated, link them
      user: req.userId || null,
    });

    return res.status(201).json({
      success: true,
      message: "Your message has been received. We'll get back to you within two working days.",
      id: contact._id,
    });
  } catch (error) {
    console.error("Contact form submission failed:", error);
    return res.status(500).json({ error: "Failed to send your message. Please try again or email us directly." });
  }
};
