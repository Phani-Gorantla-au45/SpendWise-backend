import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: String,
  orderId: String,
  paymentId: String,
  amount: Number,
  currency: String,
  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "PENDING",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Payment", paymentSchema);
