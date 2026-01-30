const User = require("../models/User");
const jwt = require("jsonwebtoken");

//Register
exports.registerUser = async (req, res) => {
  const { firstName, lastName, email, mobile } = req.body;

  const userExists = await User.findOne({ mobile });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    mobile
  });

  res.json({ message: "Registration successful", user });
};

//Otp
exports.sendOtp = async (req, res) => {
  const { mobile } = req.body;

  const user = await User.findOne({ mobile });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000;
  await user.save();

  console.log("OTP:", otp); // later send SMS

  res.json({ message: "OTP sent" });
};

//Verify otp with mobile number
exports.verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  const user = await User.findOne({ mobile });
  if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  res.json({ token });
};
