import "dotenv/config"; // MUST be first

console.log("🔥 THIS INDEX FILE IS RUNNING 🔥");

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./src/routes/authRoutes.js";
import { razorpayWebhook } from "./src/payments/payment.controller.js";

const app = express();
app.get("/ping", (req, res) => {
  res.send("PING OK");
});


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


// import "dotenv/config";
// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";

// import authRoutes from "./src/routes/authRoutes.js";
// import paymentRoutes from "./src/payments/payment.routes.js";



// const app = express();


// app.use(cors());

// /**
//  * ❗ DO NOT PARSE JSON BEFORE WEBHOOK
//  * Webhook must receive RAW body
//  */

// // ✅ Webhook route FIRST (raw body only)
// app.use(
//   "/api/payments/webhook",
//   express.raw({ type: "application/json" })
// );

// // ✅ Now JSON parsing for rest of app
// app.use(express.json());

// app.use("/api/auth", authRoutes);
// app.use("/api/payments", paymentRoutes);

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch(console.error);

// app.listen(process.env.PORT || 5001, () => {
//   console.log("Server running");
// });

