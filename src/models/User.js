// models/User.js
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    phone: { type: String, required: true, unique: true },

    First_name: String,
    Last_name: String,
    email: { type: String, unique: true, sparse: true },

    otp: String,
    otpExpiry: Date,
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);