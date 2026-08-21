import express from "express"
import dotenv from "dotenv"
import connectDB from "./utils/db.js"

dotenv.config()

const PORT = process.env.PORT || 5000
const app = express()






app.get("/", (req, res) => {
    res.status(200).json({ message: "ExamniAI Backend is running" });
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: " Server health is OK" });
});


app.listen(PORT,async()=>{
    await connectDB()
    console.log(`✅ Server is running on port ${PORT}`)
})


// Whenever we call router our controller will be called and it will handle the request and response.