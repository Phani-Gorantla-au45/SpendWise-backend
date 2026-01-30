import User from "../models/User.js";
import axios from "axios";
import jwt from "jsonwebtoken";

// 4-digit OTP generator
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// Send OTP via Fast2SMS
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
      },
    );
    console.log("Fast2SMS Response:", response.data);
    return response.data;
  } catch (err) {
    console.error("Fast2SMS Error:", err.response?.data || err.message);
    throw new Error("Failed to send OTP");
  }
};

//send otp
export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res
        .status(400)
        .json({ status: "error", message: "Phone number required" });
    }

    // Generate OTP and expiry
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Save or update user with OTP
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone, otp, otpExpiry, isVerified: false });
    } else {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.isVerified = false;
    }
    await user.save();

    // Send OTP
    await sendOTP(phone, otp);

    res.status(200).json({
      status: "success",
      message: "OTP sent successfully",
      data: { phone },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ status: "error", message: "Server error", error: err.message });
  }
};

//verify otp
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res
        .status(400)
        .json({ status: "error", message: "Phone and OTP required" });
    }

    const user = await User.findOne({ phone, otp });
    if (!user) {
      return res.status(400).json({ status: "error", message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ status: "error", message: "OTP expired" });
    }

    // Mark verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // JWT token (for session)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    const isProfileComplete =
      user.First_name && user.Last_name && user.email ? true : false;

    res.json({
      status: "success",
      message: "OTP verified successfully ✅",
      data: {
        token,
        isNewUser: !isProfileComplete
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ status: "error", message: "Server error", error: err.message });
  }
};

//save user
export const registerUser = async (req, res) => {
  try {
    const { phone, First_name, Last_name, email } = req.body;

    if (!phone || !First_name || !Last_name || !email) {
      return res.status(400).json({
        status: "error",
        message: "Phone, First_name, Last_name, and email are required",
      });
    }

    const user = await User.findOne({ phone, isVerified: true });
    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "User not verified" });
    }

    // Save details
    user.First_name = First_name;
    user.Last_name = Last_name;
    user.email = email;
    await user.save();

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
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ status: "error", message: "Server error", error: err.message });
  }
};