import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  // 🔹 for normal orders
  userId: String,
  orderId: String,
  paymentId: String,

  // 🔹 for gift card
  uniqueId: String,
  sku: String,
  finalAmount: Number,
  paymentUrl: String,
  razorpayPaymentLinkId: String,

  amount: Number,
  currency: {
    type: String,
    default: "INR",
  },

  status: {
    type: String,
    enum: [
      "PENDING",
      "SUCCESS",
      "FAILED",
      "PAYMENT_INITIATED"
    ],
    default: "PENDING",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Payment", paymentSchema);
