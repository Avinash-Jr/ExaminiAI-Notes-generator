import UserModel from "../models/user.models.js";
import { getToken } from "../utils/token.js";
import { logActivity } from "../utils/logActivity.js";

export const googleAuth = async (req, res) => {
    try {
        const { email, name } = req.body;

        // Check whether user already exists
        let user = await UserModel.findOne({ email });

        // Create user if not found
        if (!user) {
            user = await UserModel.create({
                name,
                email,
            });
        }

        // Generate JWT token
        const token = await getToken(user._id);

        // Store token in cookie
        res.cookie("Token", token, {
            httpOnly: true,
            secure: false, // false for localhost, true in production (HTTPS)
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

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
        console.error("GoogleSignUp Error:", error);

        return res.status(500).json({
            message: "GoogleSignUp Error",
            error: error.message,
        });
    }
};

export const logOut = async (req, res) => {
    try {
        // Cookie name must match the cookie created above
        res.clearCookie("Token", {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
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