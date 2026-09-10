import ActivityModel from "../models/activity.models.js";

/**
 * GET /api/activity
 * Returns the authenticated user's activity log, newest first.
 * Query params:
 *   ?kind=Notes+generated   — filter by event kind
 *   ?limit=50               — max items (default 100, cap 500)
 *   ?before=2026-09-01T00:00:00  — cursor-based pagination
 */
export const getActivity = async (req, res) => {
  try {
    const filter = { user: req.userId };

    // Optional kind filter
    if (req.query.kind) {
      filter.kind = req.query.kind;
    }

    // Cursor-based pagination: fetch events created before this timestamp
    if (req.query.before) {
      const before = new Date(req.query.before);
      if (!isNaN(before.getTime())) {
        filter.createdAt = { $lt: before };
      }
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);

    const events = await ActivityModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Map to the shape the client History page expects
    const data = events.map((e) => ({
      id: String(e._id),
      at: e.createdAt.toISOString(),
      kind: e.kind,
      title: e.title,
      detail: e.detail || "",
      credits: e.credits || 0,
    }));

    return res.status(200).json({ data, count: data.length });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return res.status(500).json({ error: "Failed to fetch activity." });
  }
};
