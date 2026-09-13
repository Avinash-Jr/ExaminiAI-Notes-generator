import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  getMyOrgs,
  createOrg,
  getOrgMembers,
  inviteMember,
} from "../controllers/org.controller.js";
import { requireOrgMember } from "../middleware/requireOrgMember.js";

const orgRouter = express.Router();

orgRouter.use(isAuth);

orgRouter.get("/my-orgs", getMyOrgs);
orgRouter.post("/create", createOrg);
orgRouter.get("/:orgId/members", requireOrgMember(), getOrgMembers);
orgRouter.post("/:orgId/invite", requireOrgMember(["owner", "admin"]), inviteMember);

export default orgRouter;
