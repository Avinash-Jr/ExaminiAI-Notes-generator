import SubscriptionModel from "../models/subscription.models.js";
import InvoiceModel from "../models/invoice.models.js";
import UserModel from "../models/user.models.js";

export const getBillingSummary = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await UserModel.findById(userId).select("credits email name").lean();

    const subscription = (await SubscriptionModel.findOne({ userId, status: "active" }).lean()) || {
      planId: "free",
      status: "active",
      currentPeriodEnd: null,
    };

    const invoices = await InvoiceModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      billing: {
        credits: user?.credits ?? 0,
        subscription,
        invoices,
      },
    });
  } catch (error) {
    console.error("Error in getBillingSummary:", error);
    return res.status(500).json({ error: "Failed to load billing summary." });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const userId = req.userId;
    const invoices = await InvoiceModel.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, invoices });
  } catch (error) {
    console.error("Error in getInvoices:", error);
    return res.status(500).json({ error: "Failed to retrieve invoices." });
  }
};
