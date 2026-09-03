import express from "express"
// isAuth is the middleware, not a controller — importing it from
// user.controller.js handed this route a second copy of getCurrentUser, so the
// token was never checked and req.userId was always undefined.
import isAuth from "../middleware/isAuth.js"
import getCurrentUser from "../controllers/user.controller.js"


const userRouter = express.Router()

userRouter.get("/currentuser", isAuth, getCurrentUser)

export default userRouter
