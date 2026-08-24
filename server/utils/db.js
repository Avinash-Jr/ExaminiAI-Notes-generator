import mongoose from "mongoose"

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("✅✅ Database Connected Successfully ")
    } catch (error) {
        console.log(error,"❌❌ Error while connectting to the database")
    }
}

export default connectDB