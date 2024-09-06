import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://germandenaroc:RRjqnqIyCnGiQOPc@cluster0.dh9yl.mongodb.net/food-delivery').then(()=> console.log("DB Connected"))
}