import UserModel from "../models/user.models.js"


const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId
        const user = await UserModel.findById(userId)
        if(!user){
            return res.status(404).json({message:"Current user is Not Find"})
        }
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({message:`User not found in database ${error}`})
    }
}

export default getCurrentUser