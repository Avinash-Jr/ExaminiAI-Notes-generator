import UserModel from "../models/user.models.js";
import { getToken } from "../utils/token.js";
import { logActivity } from "../utils/logActivity.js";

const IS_PROD = process.env.NODE_ENV === "production";

/** Shared cookie options — production uses Secure + SameSite=None for cross-origin. */
const cookieOpts = {
    httpOnly: true,
    secure: IS_PROD,                       // true over HTTPS in production
    sameSite: IS_PROD ? "none" : "strict", // "none" allows cross-origin cookies
    maxAge: 7 * 24 * 60 * 60 * 1000,      // 7 days
};

/* ------------------------------------------------------------------ */
/*  Firebase Admin — only initialised when a service account is set.   */
/*  Verifying the Firebase ID token server-side is what stops anyone   */
/*  from POSTing a victim's email and being handed their session.      */
/*  Configure with either FIREBASE_SERVICE_ACCOUNT (the service-account*/
/*  JSON as a single-line string) or GOOGLE_APPLICATION_CREDENTIALS.   */
/* ------------------------------------------------------------------ */
let firebaseAdmin = null;
let firebaseAdminTried = false;

async function getFirebaseAdmin() {
    if (firebaseAdmin) return firebaseAdmin;
    if (firebaseAdminTried) return null;
    firebaseAdminTried = true;

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw && !process.env.GOOGLE_APPLICATION_CREDENTIALS) return null;

    try {
        const admin = (await import("firebase-admin")).default;
        if (!admin.apps.length) {
            const credential = raw
                ? admin.credential.cert(JSON.parse(raw))
                : admin.credential.applicationDefault();
            admin.initializeApp({ credential });
        }
        firebaseAdmin = admin;
        return admin;
    } catch (e) {
        console.warn(
            "firebase-admin unavailable — Google token verification disabled.",
            e?.message
        );
        return null;
    }
}

export const googleAuth = async (req, res) => {
    try {
        const { idToken, email: bodyEmail, name: bodyName } = req.body || {};

        let email;
        let name;

        const admin = await getFirebaseAdmin();
        if (admin) {
            /* ---------- SECURE PATH: verify the Firebase ID token ---------- */
            if (!idToken) {
                return res.status(401).json({ message: "Missing Google sign-in token." });
            }
            let decoded;
            try {
                decoded = await admin.auth().verifyIdToken(idToken);
            } catch (e) {
                console.error("Firebase token verification failed:", e?.message);
                return res.status(401).json({ message: "Invalid or expired Google sign-in token." });
            }
            if (!decoded.email) {
                return res.status(400).json({ message: "No email associated with this Google account." });
            }
            if (decoded.email_verified === false) {
                return res.status(403).json({ message: "Your Google email address is not verified." });
            }
            email = decoded.email;
            name = decoded.name || bodyName || email.split("@")[0];
        } else {
            /* ---------- DEV-ONLY FALLBACK (no server-side verification) ----
               Without a service account we cannot verify who the caller is,
               so trusting the request body is insecure. That is acceptable
               ONLY for local development and is refused in production. */
            if (IS_PROD) {
                return res.status(503).json({ message: "Authentication is not configured on the server." });
            }
            email = bodyEmail;
            name = bodyName;
            if (!email) {
                return res.status(400).json({ message: "No email associated with this account." });
            }
        }

        // Check whether user already exists
        let user = await UserModel.findOne({ email });

        // Create user if not found
        if (!user) {
            user = await UserModel.create({ name, email });
        }

        // Generate JWT token
        const token = await getToken(user._id);

        // Store token in cookie
        res.cookie("Token", token, cookieOpts);

        // Log the sign-in activity
        logActivity({
          userId: user._id,
          kind: "Signed in",
          title: "Signed in with Google",
          detail: `${name} (${email})`,
        });

        return res.status(200).json({
            message: "User authenticated successfully",
            user,
        });
    } catch (error) {
        console.error("GoogleAuth Error:", error);

        return res.status(500).json({
            message: "Authentication failed. Please try again.",
        });
    }
};

export const logOut = async (req, res) => {
    try {
        // Cookie name must match the cookie created above
        res.clearCookie("Token", {
            httpOnly: true,
            secure: IS_PROD,
            sameSite: IS_PROD ? "none" : "strict",
        });

        return res.status(200).json({
            message: "User has successfully logged out",
        });
    } catch (error) {
        console.error("LogOut Error:", error);

        return res.status(500).json({
            message: "LogOut Error",
            error: error.message,
        });
    }
};