import UserModel from "../models/user.models.js"
import { getToken } from "../utils/token.js"


export const googleAuth = async (req, res) => {
    try {
        const {email, name} =req.body
        let user = await UserModel.findOne({email})
        if(!user){
            user = await UserModel.create({
                name , email // These fields are already written in out UserSchema that's why we are able to use these fields
            })
        }
        let token = await getToken(user._id)
        res.cookie("Token", token,{ httpOnly:true, secure:true, samesite:"strict", maxAge:7 * 24 * 60* 60* 1000 })
        // maxAge:7 * 24 * 60* 60* 1000 }) = 7days
        return res.status(200).json({message:"User", user})
    } catch (error) {
        return res.status(500).json({message:`GoogleSignUp Error ${error}`})
    }    
}


export const logOut = async(req, res)=>{
    try {
        await res.clearCookie("token")
        return res.status(200).json({message:`User has successfully logged out`})
    } catch (error) {
        return res.status(500).json({message:`LogOut Error ${error}`})
        
    }
}