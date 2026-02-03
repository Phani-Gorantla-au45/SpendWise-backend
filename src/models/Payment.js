// models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: String, ref: "User" },
  razorpayOrderId: String,
  paymentId: String,
  amount: Number,
  currency: String,
  status: { type: String, default: "PENDING" },
  orderPayload: Object
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
