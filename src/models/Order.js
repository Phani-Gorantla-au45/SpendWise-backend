// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, ref: "User" },
  provider: { type: String, default: "GoldBee" },

  requestPayload: Object,   // what you sent
  responsePayload: Object,  // card data received

  status: { type: String, default: "PROCESSING" }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);