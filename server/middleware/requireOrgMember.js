import mongoose from "mongoose";
import MembershipModel from "../models/membership.models.js";

/**
 * Guards any /:orgId route so only members of that workspace can proceed.
 * Must run AFTER isAuth (so req.userId exists).
 *
 * @param {string[]} allowedRoles - roles permitted for this route
 */
export const requireOrgMember = (allowedRoles = ["owner", "admin", "member", "viewer"]) => {
  return async (req, res, next) => {
    const { orgId } = req.params;
    if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
      return res.status(400).json({ error: "Invalid organization id." });
    }
    try {
      const membership = await MembershipModel.findOne({
        orgId,
        userId: req.userId,
        status: "active",
      }).lean();
      if (!membership) {
        return res.status(403).json({ error: "Not a member of this workspace." });
      }
      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({ error: "Insufficient role for this action." });
      }
      req.membership = membership;
      return next();
    } catch (err) {
      console.error("requireOrgMember error:", err);
      return res.status(500).json({ error: "Authorization check failed." });
    }
  };
};

export default requireOrgMember;
