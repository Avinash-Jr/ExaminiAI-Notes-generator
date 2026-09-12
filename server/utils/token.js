import jwt from "jsonwebtoken";

export const getToken = async (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        // Fail loudly: a missing secret must never silently produce a
        // tokenless "successful" login.
        throw new Error("JWT_SECRET is not configured.");
    }
    // Never log tokens — they are live session credentials.
    return jwt.sign({ userId }, secret, { expiresIn: "7d" });
};
