//  We find our userId with the help of tokens. So here we will be finding our userId here.


import jwt from "jsonwebtoken"
const isAuth = async (req, res, next) => {
    try {
        let {token} = req.cookies
        if(!token){
            return res.status(400).json({message:"Token not found"})
        }
        let verifyToken = await jwt.verify("Token", token, process.env.JWT_SECRET)
        if(!verifyToken){
            return res.status(401).json({message:"Please First Verify the Token"})
        }
        req.userId = verifyToken.userId
        next()
    } catch (error) {
        return res.status(500).json({message:"Authentication Error", error})
    }
}

export default isAuth