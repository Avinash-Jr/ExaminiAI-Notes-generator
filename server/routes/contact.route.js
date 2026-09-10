import express from "express";
import jwt from "jsonwebtoken";
import { submitContact } from "../controllers/contact.controller.js";

const contactRouter = express.Router();

// Optional auth — if the user happens to be signed in we link them,
// but the form works for anonymous visitors too.
const optionalAuth = (req, res, next) => {
  const { Token: token } = req.cookies;
  if (!token) {
    req.userId = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
  } catch {
    req.userId = null;
  }
  next();
};

contactRouter.post("/", optionalAuth, submitContact);

export default contactRouter;
