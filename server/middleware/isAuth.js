//  We find our userId with the help of tokens. So here we will be finding our userId here.


import jwt from "jsonwebtoken"

/**
 * Reads the JWT that the login route stored in the cookie and hangs the user id
 * on the request for the controller behind it.
 *
 * The cookie name has to match `res.cookie("Token", ...)` in
 * auth.controller.js character for character. Reading a lowercase `token` gives
 * undefined, and every protected route then answers "not logged in" even though
 * the browser is holding a perfectly good session.
 */
const isAuth = async (req, res, next) => {
    const { Token: token } = req.cookies

    if (!token) {
        return res.status(401).json({ message: "Not authenticated" })
    }

    try {
        // jwt.verify(token, secret) — in that order. Passing the cookie name
        // first makes every request fail with "invalid signature".
        const payload = jwt.verify(token, process.env.JWT_SECRET)

        req.userId = payload.userId
        next()
    } catch (error) {
        // An expired or tampered token is an authentication failure, not a
        // server fault — 401 lets the client just show the sign-in page.
        return res.status(401).json({
            message: "Session is invalid or has expired",
            error: error.message,
        })
    }
}

export default isAuth
