import razorpay from "./razorpayClient.js";
import Payment from "./payment.model.js";
import { verifySignature } from "./payment.verify.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
  try {
    const { amount, userId } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
    });

    // Save PENDING transaction
    await Payment.create({
      userId,
      orderId: order.id,
      amount,
      currency: order.currency,
      status: "PENDING",
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    console.log("VERIFY BODY:", req.body);

    const isValid = verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    if (!isValid) {
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: "FAILED" },
      );
      return res.status(400).json({ success: false });
    }

    await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id,
        status: "SUCCESS",
      },
    );

    res.json({ success: true, message: "Payment verified" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const razorpayWebhook = async (req, res) => {
  console.log("==================================");
  console.log("🔥 RAZORPAY WEBHOOK HIT 🔥");
  console.log("Time:", new Date().toISOString());
  console.log("HEADERS:", req.headers);
  console.log("RAW BODY TYPE:", typeof req.body);
  console.log("IS BUFFER:", Buffer.isBuffer(req.body));
  console.log("==================================");

  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!Buffer.isBuffer(req.body)) {
      console.error("❌ BODY IS NOT BUFFER — middleware order is wrong");
      return res.status(400).json({ error: "Invalid body type" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body) // ✅ RAW BUFFER
      .digest("hex");

    console.log("Received Signature:", signature);
    console.log("Generated Signature:", generatedSignature);

    if (generatedSignature !== signature) {
      console.error("❌ SIGNATURE MISMATCH");
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    console.log("✅ Signature verified");

    // Parse AFTER verification
    const payload = JSON.parse(req.body.toString());
    const event = payload.event;

    console.log("Webhook Event:", event);

    if (event === "payment.captured") {
      const payment = payload.payload.payment.entity;

      const updated = await Payment.findOneAndUpdate(
        { orderId: payment.order_id },
        {
          paymentId: payment.id,
          status: "SUCCESS",
        },
        { new: true }
      );

      console.log("✅ Payment updated:", updated);
    }

    if (event === "payment.failed") {
      const payment = payload.payload.payment.entity;

      await Payment.findOneAndUpdate(
        { orderId: payment.order_id },
        { status: "FAILED" }
      );

      console.log("❌ Payment failed");
    }

    res.json({ received: true });
  } catch (err) {
    console.error("🔥 WEBHOOK ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};



