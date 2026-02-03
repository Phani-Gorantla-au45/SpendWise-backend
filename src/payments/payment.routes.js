import express from "express";
import {
  createOrder,
  verifyPayment,
  razorpayWebhook,
} from "./payment.controller.js";

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);

// ✅ IMPORTANT: RAW BODY FOR WEBHOOK
router.post("/webhook", razorpayWebhook);


export default router;
