import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  getBillingSummary,
  getInvoices,
} from "../controllers/billing.controller.js";

const billingRouter = express.Router();

billingRouter.use(isAuth);

billingRouter.get("/summary", getBillingSummary);
billingRouter.get("/invoices", getInvoices);

export default billingRouter;
