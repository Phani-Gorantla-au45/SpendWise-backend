// import razorpay from "../config/razorpayClient.js";
// import { verifySignature } from "../utils/verifyRazorpaySignature.js";
// import crypto from "crypto";
// import Order from "../models/Order.js";


// export const createOrder = async (req, res) => {
//   try {
//     console.log("===== CREATE ORDER HIT =====");
//     console.log("HEADERS:", req.headers);
//     console.log("REQ.USER:", req.user);
//     console.log("BODY:", req.body);

//     if (!req.user) {
//       return res.status(401).json({ message: "req.user is missing" });
//     }

//     const { amount } = req.body;
//     if (!amount) {
//       return res.status(400).json({ message: "Amount missing" });
//     }

//     const userId = req.user.id || req.user._id;

//     const order = await razorpay.orders.create({
//       amount: amount * 100,
//       currency: "INR",
//       receipt: "rcpt_" + Date.now(),
//     });

//     await Order.create({
//       userId,
//       orderId: order.id,
//       amount,
//       currency: order.currency,
//       status: "PENDING",
//     });

//     res.json({
//       orderId: order.id,
//       amount: order.amount,
//       currency: order.currency,
//       key: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (err) {
//     console.error("❌ CREATE ORDER ERROR:", err);
//     res.status(500).json({ error: err.message });
//   }
// };


// export const verifyPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       orderPayload, // ⬅ send GoldBee-style data from frontend
//     } = req.body;

//     const isValid = verifySignature(
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature
//     );

//     if (!isValid) {
//       await Order.findOneAndUpdate(
//         { orderId: razorpay_order_id },
//         { status: "FAILED" }
//       );
//       return res.status(400).json({ success: false });
//     }

//     // 1️⃣ Update payment
//     await Order.findOneAndUpdate(
//       { orderId: razorpay_order_id },
//       {
//         paymentId: razorpay_payment_id,
//         status: "SUCCESS",
//       }
//     );

//     // 2️⃣ CREATE FINAL ORDER (THIS WAS MISSING)
//     const order = await Order.create({
//       userId: req.user.id,
//       ...orderPayload, // GoldBee-style object
//     });

//     res.json({
//       success: true,
//       message: "Payment verified & order created",
//       order,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// export const razorpayWebhook = async (req, res) => {
//   try {
//     console.log("🔥 WEBHOOK HIT:", req.body.event);
//     const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

//     const signature = req.headers["x-razorpay-signature"];

//     const generatedSignature = crypto
//       .createHmac("sha256", secret)
//       .update(JSON.stringify(req.body))
//       .digest("hex");

//     if (generatedSignature !== signature) {
//       return res.status(400).json({ message: "Invalid webhook signature" });
//     }

//     const event = req.body.event;

//     if (event === "payment.captured") {
//       const payment = req.body.payload.payment.entity;

//       await Payment.findOneAndUpdate(
//         { orderId: payment.order_id },
//         {
//           paymentId: payment.id,
//           status: "SUCCESS",
//         },
//       );
//     }

//     if (event === "payment.failed") {
//       const payment = req.body.payload.payment.entity;

//       await Payment.findOneAndUpdate(
//         { orderId: payment.order_id },
//         { status: "FAILED" },
//       );
//     }

//     res.json({ received: true });
//   } catch (err) {
//     console.error("Webhook error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// controllers/paymentController.js
import razorpay from "../config/razorpayClient.js";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";

//create order
export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
    });

    await Payment.create({
      userId,
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: "INR",
      status: "PENDING",
    });

    res.json({ orderId: razorpayOrder.id, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//razor pay web hook
export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (generatedSignature !== signature)
      return res.status(400).json({ message: "Invalid signature" });

    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;

    if (event === "payment.captured") {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: paymentEntity.order_id },
        { paymentId: paymentEntity.id, status: "SUCCESS" }
      );
    }

    if (event === "payment.failed") {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: paymentEntity.order_id },
        { status: "FAILED" }
      );
    }

    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//save gift cards
export const saveGiftCardOrder = async (req, res) => {
  try {
    const { goldbeeResponse } = req.body;

    const order = await Order.create({
      refno: goldbeeResponse.refno,
      cardNumber: goldbeeResponse.cardDetails?.[0]?.cardNumber,
      cardPin: goldbeeResponse.cardDetails?.[0]?.cardPin,
      status: goldbeeResponse.status,
      fullResponse: goldbeeResponse
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};