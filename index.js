import "dotenv/config"; // MUST be first

console.log("🔥 THIS INDEX FILE IS RUNNING 🔥");

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./src/routes/authRoutes.js";
import { razorpayWebhook } from "./src/payments/payment.controller.js";

const app = express();

/**
 * 🔥 1️⃣ RAZORPAY WEBHOOK — MUST COME FIRST
 * NO express.json() BEFORE THIS
 */
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

/**
 * 🔥 2️⃣ NOW enable JSON for rest of app
 */
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Spendwise API is running 🚀");
});

app.use("/api/auth", authRoutes);

/**
 * 🔥 3️⃣ Normal payment routes (NO webhook here)
 */
const paymentRoutes = (await import("./src/payments/payment.routes.js")).default;
app.use("/api/payments", paymentRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
