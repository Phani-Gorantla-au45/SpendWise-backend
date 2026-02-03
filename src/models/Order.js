// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, ref: "User" },
  uniqueId: String,
  reward: Number,
  address: Object,
  payments: Array,
  refno: String,
  syncOnly: Boolean,
  deliveryMode: String,
  products: Array
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);