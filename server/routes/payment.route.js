import express from "express";
import isAuth from "../middleware/isAuth.js";
import { getPaymentConfig, createOrder, verifyPayment, getReceipt } from "../controllers/payment.controller.js";

const paymentRouter = express.Router();

paymentRouter.get("/config", getPaymentConfig);           // Public — returns mode + key
paymentRouter.post("/create-order", isAuth, createOrder);  // Creates Razorpay or mock order
paymentRouter.post("/verify", isAuth, verifyPayment);      // Verifies payment & credits user
paymentRouter.get("/receipt/:id", isAuth, getReceipt);     // Fetch receipt

export default paymentRouter;
