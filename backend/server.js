import express from "express";
import cors from "cors"
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import 'dotenv/config.js'



// app config
const app = express()
const port = 4000


// middleware
app.use(express.json())
app.use(cors())


// db connection
connectDB();


// api endpoints
app.use("/api/food", foodRouter)
app.use("/images", express.static('uploads'))
app.use("/api/user", userRouter)



app.get("/", (req, res)=>{
    res.send("API WORKING")
})

app.get("/ping", (req, res)=>{
    res.send("PONG")
})

app.listen(port,()=> {
    console.log(`Server Started on http://localhost:${port}`)
})

//mongodb+srv://germandenaroc:RRjqnqIyCnGiQOPc@cluster0.dh9yl.mongodb.net/?