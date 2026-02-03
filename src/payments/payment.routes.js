import express from "express";
import {
  createOrder,
  verifyPayment,
  razorpayWebhook,
} from "./payment.controller.js";

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.post("/webhook", express.json({ type: "*/*" }), razorpayWebhook);

export default router;
