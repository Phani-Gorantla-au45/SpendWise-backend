import express from "express";
import {
  createOrder,
  // verifyPayment,
  razorpayWebhook,
  saveGiftCardOrder,
} from "../controllers/paymentController.js";
import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();

// 🔥 PROTECTED ROUTE (VERY IMPORTANT)
router.post("/create-order", authMiddleware, createOrder);

// router.post("/verify", verifyPayment);
router.post("/webhook", express.json({ type: "*/*" }), razorpayWebhook);

router.post("/orders/save", saveGiftCardOrder);

export default router;
