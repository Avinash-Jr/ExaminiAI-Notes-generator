import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  getMyOrgs,
  createOrg,
  getOrgMembers,
  inviteMember,
} from "../controllers/org.controller.js";

const orgRouter = express.Router();

orgRouter.use(isAuth);

orgRouter.get("/my-orgs", getMyOrgs);
orgRouter.post("/create", createOrg);
orgRouter.get("/:orgId/members", getOrgMembers);
orgRouter.post("/:orgId/invite", inviteMember);

export default orgRouter;
