import OrgModel from "../models/org.models.js";
import MembershipModel from "../models/membership.models.js";
import UserModel from "../models/user.models.js";

export const getMyOrgs = async (req, res) => {
  try {
    const userId = req.userId;
    const memberships = await MembershipModel.find({ userId, status: "active" })
      .populate("orgId")
      .lean();

    const orgs = memberships.map((m) => ({
      ...m.orgId,
      role: m.role,
      membershipId: m._id,
    }));

    return res.status(200).json({ success: true, orgs });
  } catch (error) {
    console.error("Error in getMyOrgs:", error);
    return res.status(500).json({ error: "Failed to retrieve organizations." });
  }
};

export const createOrg = async (req, res) => {
  try {
    const userId = req.userId;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Organization name is required." });
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;

    const org = await OrgModel.create({
      name: name.trim(),
      slug,
      ownerId: userId,
      plan: "free",
    });

    await MembershipModel.create({
      orgId: org._id,
      userId,
      role: "owner",
      status: "active",
    });

    return res.status(201).json({ success: true, org });
  } catch (error) {
    console.error("Error in createOrg:", error);
    return res.status(500).json({ error: "Failed to create organization." });
  }
};

export const getOrgMembers = async (req, res) => {
  try {
    const { orgId } = req.params;
    const members = await MembershipModel.find({ orgId })
      .populate("userId", "name email")
      .lean();

    return res.status(200).json({ success: true, members });
  } catch (error) {
    console.error("Error in getOrgMembers:", error);
    return res.status(500).json({ error: "Failed to retrieve team members." });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { email, role = "member" } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: "User with this email not found on ExaminAI." });
    }

    const existing = await MembershipModel.findOne({ orgId, userId: user._id });
    if (existing) {
      return res.status(400).json({ error: "User is already a member of this workspace." });
    }

    const membership = await MembershipModel.create({
      orgId,
      userId: user._id,
      role,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      membership: { ...membership.toObject(), userId: { name: user.name, email: user.email } },
    });
  } catch (error) {
    console.error("Error in inviteMember:", error);
    return res.status(500).json({ error: "Failed to invite member." });
  }
};
