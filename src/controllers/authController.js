// controllers/auth.controller.js

import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // ✅ FIXED (use User, not Order)


// ============================
// Generate OTP
// ============================
const generateOTP = () =>
  Math.floor(1000 + Math.random() * 9000).toString();


// ============================
// Send OTP via Fast2SMS
// ============================
const sendOTP = async (phone, otp) => {
  try {
    const response = await axios.post(
      process.env.FAST2SMS_API_URL,
      {
        route: "dlt",
        sender_id: "SPENDI",
        message: "181034",
        variables_values: `Your Cardbee OTP is ${otp}`,
        schedule_time: "",
        flash: 0,
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Fast2SMS Error:", err.response?.data || err.message);
    throw new Error("Failed to send OTP");
  }
};


// ============================
// SEND OTP
// ============================
export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ status: "error", message: "Phone number required" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // ✅ SAVE IN USER COLLECTION (FIXED)
    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({ phone });
    }

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.isVerified = false;

    await user.save();

    await sendOTP(phone, otp);

    res.json({
      status: "success",
      message: "OTP sent successfully",
      data: { phone },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: err.message,
    });
  }
};


// ============================
// VERIFY OTP
// ============================
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res
        .status(400)
        .json({ status: "error", message: "Phone and OTP required" });
    }

    // ✅ FIND USER ONLY BY PHONE (safer)
    const user = await User.findOne({ phone });

    if (!user || user.otp !== otp) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res
        .status(400)
        .json({ status: "error", message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    const isProfileComplete =
      user.First_name && user.Last_name && user.email;

    res.json({
      status: "success",
      message: "OTP verified successfully ✅",
      data: {
        token,
        isNewUser: !isProfileComplete,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: err.message,
    });
  }
};


// ============================
// REGISTER USER DETAILS
// ============================
export const registerUser = async (req, res) => {
  try {
    const { phone, First_name, Last_name, email } = req.body;

    if (!phone || !First_name || !Last_name || !email) {
      return res.status(400).json({
        status: "error",
        message: "Phone, First_name, Last_name, and email are required",
      });
    }

    // ✅ USER COLLECTION
    const user = await User.findOne({ phone, isVerified: true });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "User not verified",
      });
    }

    user.First_name = First_name;
    user.Last_name = Last_name;
    user.email = email;

    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        phone: user.phone,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      status: "success",
      message: "User details saved successfully ✅",
      data: {
        id: user._id,
        phone: user.phone,
        First_name: user.First_name,
        Last_name: user.Last_name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: err.message,
    });
  }
};
