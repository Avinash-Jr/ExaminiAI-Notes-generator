import express from "express";
import isAuth from "../middleware/isAuth.js";
import { getActivity } from "../controllers/activity.controller.js";

const activityRouter = express.Router();

activityRouter.get("/", isAuth, getActivity);

export default activityRouter;
