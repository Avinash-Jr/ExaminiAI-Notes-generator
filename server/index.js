import express from "express";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import authRouter from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import generateRouter from "./routes/generate.route.js";
import notesRouter from "./routes/notes.route.js";
import paymentRouter from "./routes/payment.route.js";
import activityRouter from "./routes/activity.route.js";
import contactRouter from "./routes/contact.route.js";

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

// CORS configuration - must come BEFORE routes
const IS_PROD = process.env.NODE_ENV === "production";
const ALLOWED_ORIGIN = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
    cors({
        origin: ALLOWED_ORIGIN,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
);

// Trust proxy in production (Render, Railway, etc. sit behind a reverse proxy)
if (IS_PROD) app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/notes", generateRouter); // Note generation route
app.use("/api/notes", notesRouter);     // User notes retrieval route
app.use("/api/payment", paymentRouter); // Payment & credit purchase route
app.use("/api/activity", activityRouter); // User activity history
app.use("/api/contact", contactRouter);   // Contact form submissions

app.get("/", (req, res) => {
    res.status(200).json({
        message: "ExamniAI Backend is running",
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "Server health is OK",
    });
});

// 404 handler for unknown API routes
app.use("/api", (req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Global error handler — catches unhandled errors so the server doesn't crash
app.use((err, req, res, _next) => {
    console.error("Unhandled error:", err);
    const status = err.statusCode || err.status || 500;
    res.status(status).json({
        error: process.env.NODE_ENV === "production"
            ? "An internal error occurred."
            : err.message || "An internal error occurred.",
    });
});

app.listen(PORT, async () => {
    console.log(`🚀 Server is starting on port ${PORT}`);
    await connectDB();
    console.log(`✅ Server is running on port ${PORT}`);
});
        