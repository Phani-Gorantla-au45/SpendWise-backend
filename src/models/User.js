import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    phone: { type: String, required: true, unique: true },

    // Step 2 fields (not required initially)
    First_name: { type: String },
    Last_name: { type: String },
    email: { type: String, unique: true, sparse: true },

    // OTP related
    otp: { type: String },
    otpExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);