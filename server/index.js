import express from "express"
import dotenv from "dotenv"
import connectDB from "./utils/db.js"
import authRouter from "./routes/auth.route.js"
import cookieParser from "cookie-parser"
import cors from "cors"

dotenv.config()

const PORT = process.env.PORT || 5000
const app = express();
app.use(cors({origin:"http://localhost:5173",
    credentials:true,
    methods:["GET", "POST","PUT","PATCH","DELETE", "OPTIONS", "UPDATE"]
    }
 ))
app.use(express.json())
app.use(cookieParser)
app.use("/api/auth", authRouter)
app.get("/", (req, res) => {
    res.status(200).json({ message: "ExamniAI Backend is running" });
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: " Server health is OK" });
});


app.listen(PORT,async()=>{
    // await connectDB()
    console.log(`✅ Server is running on port ${PORT}`)
})


// Whenever we call router our controller will be called and it will handle the request and response.