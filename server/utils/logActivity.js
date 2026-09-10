import ActivityModel from "../models/activity.models.js";

/**
 * Log a user activity event.
 *
 * @param {Object} opts
 * @param {string} opts.userId   — Mongo ObjectId (string or ObjectId)
 * @param {string} opts.kind     — one of the ActivityModel enum values
 * @param {string} opts.title    — human-readable headline
 * @param {string} [opts.detail] — secondary line
 * @param {number} [opts.credits] — credit delta (negative = spent)
 * @param {string} [opts.refId]  — optional related document _id
 */
export async function logActivity({ userId, kind, title, detail = "", credits = 0, refId = null }) {
  try {
    await ActivityModel.create({ user: userId, kind, title, detail, credits, refId });
  } catch (err) {
    // Activity logging should never break the main flow
    console.warn("Failed to log activity:", err.message);
  }
}
