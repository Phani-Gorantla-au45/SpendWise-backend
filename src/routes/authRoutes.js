import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  registerUser,
  sendOtp,
  verifyOtp
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", authMiddleware, registerUser);
router.post("/send-Otp", sendOtp);
router.post("/verify-otp", verifyOtp);

router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected profile data",
    userId: req.user.id
  });
});

export default router;
