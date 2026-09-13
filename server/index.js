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
import orgRouter from "./routes/org.route.js";
import billingRouter from "./routes/billing.route.js";
import { rateLimit } from "./middleware/rateLimit.js";

dotenv.config();

// Fail fast on missing critical configuration instead of crashing mid-request.
const REQUIRED_ENV = ["MONGODB_URI", "JWT_SECRET"];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
    console.error(`❌ Missing required environment variables: ${missingEnv.join(", ")}`);
    process.exit(1);
}

const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RENDER);

// Origins permitted to access the API with credentials
const defaultAllowedOrigins = [
    "https://examini-ai-notes-generator.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:5173",
];

const envOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

const app = express();
app.disable("x-powered-by");

// Trust proxy in production (Render, Railway, etc. sit behind a reverse proxy)
if (IS_PROD) app.set("trust proxy", 1);

// Normalize leading duplicate slashes (e.g., //api/auth -> /api/auth)
app.use((req, res, next) => {
    if (req.url.startsWith("//")) {
        req.url = req.url.replace(/^\/+/, "/");
    }
    next();
});

// Minimal security headers (dependency-free). For full coverage, install `helmet`.
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-DNS-Prefetch-Control", "off");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    if (IS_PROD) {
        res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
    }
    next();
});

// CORS configuration - must come BEFORE routes
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        const cleanOrigin = origin.replace(/\/+$/, "");
        const isAllowed =
            allowedOrigins.includes(cleanOrigin) ||
            /^https:\/\/examini-ai-notes-generator.*\.vercel\.app$/.test(cleanOrigin);

        if (isAllowed) {
            return callback(null, true);
        }

        console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "X-Idempotency-Key"],
    exposedHeaders: ["Set-Cookie"],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Cap JSON body size to blunt trivial DoS via oversized payloads.
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/auth", rateLimit({ windowMs: 60_000, max: 20, name: "auth" }), authRouter);
app.use("/api/user", userRouter);
app.use("/api/notes", rateLimit({ windowMs: 60_000, max: 60, name: "notes" }), generateRouter); // Note generation route
app.use("/api/notes", notesRouter);     // User notes retrieval route
app.use("/api/payment", rateLimit({ windowMs: 60_000, max: 30, name: "payment" }), paymentRouter); // Payment & credit purchase route
app.use("/api/activity", activityRouter); // User activity history
app.use("/api/contact", rateLimit({ windowMs: 60_000, max: 10, name: "contact" }), contactRouter);   // Contact form submissions
app.use("/api/org", orgRouter);           // Multi-tenant workspaces & teams
app.use("/api/billing", billingRouter);   // Subscriptions & billing history

app.get("/", (req, res) => {
    res.status(200).json({
        message: "ExamniAI Backend is running",
    });
});

app.get("/health", async (req, res) => {
    let aiStatus = undefined;
    if (req.query.testAi === "true") {
        try {
            const { generateContent } = await import("./services/aiRouter.js");
            const t0 = Date.now();
            const r = await generateContent("Say OK");
            aiStatus = { ok: true, provider: r.provider, timeMs: Date.now() - t0 };
        } catch (e) {
            aiStatus = { ok: false, error: e.message };
        }
    }
    res.status(200).json({
        status: "Server health is OK",
        ...(aiStatus ? { ai: aiStatus } : {}),
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

// Process-level safety nets so a stray rejection/exception is logged, not silent.
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    process.exit(1);
});

// Connect to the database BEFORE accepting traffic — otherwise early requests
// reach the API before Mongo is ready. connectDB() exits the process on failure.
const start = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
    });
};
start();
        