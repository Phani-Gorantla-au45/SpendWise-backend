const authMiddleware = require("../middleware/authMiddleware");
const express = require("express");
const {
  registerUser,
  sendOtp,
  verifyOtp
} = require("../controllers/authController");

const router = express.Router();

router.post("/register",authMiddleware, registerUser);
router.post("/sendOtp", sendOtp);
router.post("/verify-otp", verifyOtp);

// 🔒 Protected route
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected profile data",
    userId: req.user.id
  });
});

module.exports = router;
