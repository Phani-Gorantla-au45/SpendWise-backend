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
  console.log("BODY:", JSON.stringify(req.body, null, 2));
  console.log("==================================");

  try {
    console.log("👉 Webhook Event:", req.body?.event);

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    console.log("Webhook secret present:", !!secret);

    const signature = req.headers["x-razorpay-signature"];
    console.log("Received Razorpay Signature:", signature);

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    console.log("Generated Signature:", generatedSignature);

    if (generatedSignature !== signature) {
      console.error("❌ SIGNATURE MISMATCH");
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    console.log("✅ Signature verified successfully");

    const event = req.body.event;
    console.log("Processing event:", event);

    if (event === "payment.captured") {
      console.log("💰 PAYMENT CAPTURED EVENT");

      const payment = req.body.payload.payment.entity;
      console.log("Payment Entity:", payment);

      const updated = await Payment.findOneAndUpdate(
        { orderId: payment.order_id },
        {
          paymentId: payment.id,
          status: "SUCCESS",
        },
        { new: true }
      );

      console.log("✅ Payment updated in DB:", updated);
    }

    if (event === "payment.failed") {
      console.log("❌ PAYMENT FAILED EVENT");

      const payment = req.body.payload.payment.entity;
      console.log("Payment Entity:", payment);

      const updated = await Payment.findOneAndUpdate(
        { orderId: payment.order_id },
        { status: "FAILED" },
        { new: true }
      );

      console.log("❌ Payment marked FAILED in DB:", updated);
    }

    console.log("✅ Webhook handled successfully");
    res.json({ received: true });

  } catch (err) {
    console.error("🔥 WEBHOOK ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

