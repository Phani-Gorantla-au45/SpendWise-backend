import "dotenv/config"; // 🔥 MUST BE FIRST — NO OTHER IMPORT ABOVE THIS

console.log("🔥 THIS INDEX FILE IS RUNNING 🔥");

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./src/routes/authRoutes.js";
import paymentRoutes from "./src/payments/payment.routes.js"

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Spendwise API is running 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
