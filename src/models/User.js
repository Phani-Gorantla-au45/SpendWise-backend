const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  mobile: { type: String, unique: true },
  otp: String,
  otpExpiry: Date
});

module.exports = mongoose.model("User", userSchema);
