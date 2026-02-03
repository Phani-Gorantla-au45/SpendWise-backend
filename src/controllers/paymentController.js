// // controllers/paymentController.js
// import razorpay from "../config/razorpayClient.js";
// import crypto from "crypto";
// import Payment from "../models/Payment.js";
// import Order from "../models/Order.js";

// /**
//  * =========================
//  * CREATE RAZORPAY ORDER
//  * =========================
//  */
// export const createOrder = async (req, res) => {
//   console.log("===== CREATE ORDER API HIT =====");
//   console.log("HEADERS:", req.headers);
//   console.log("REQ.USER:", req.user);
//   console.log("BODY:", req.body);

//   try {
//     const { amount } = req.body;
//     const userId = req.user.id;

//     console.log("Creating Razorpay order with amount:", amount);

//     const razorpayOrder = await razorpay.orders.create({
//       amount: amount * 100,
//       currency: "INR",
//     });

//     console.log("Razorpay order created:", razorpayOrder);

//     const paymentDoc = await Payment.create({
//       userId,
//       razorpayOrderId: razorpayOrder.id,
//       amount,
//       currency: "INR",
//       status: "PENDING",
//     });

//     console.log("Payment document saved:", paymentDoc);

//     res.json({
//       orderId: razorpayOrder.id,
//       key: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (err) {
//     console.error("❌ CREATE ORDER ERROR:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * =========================
//  * VERIFY PAYMENT (FRONTEND CALLBACK)
//  * =========================
//  */
// export const verifyPayment = async (req, res) => {
//   console.log("===== VERIFY PAYMENT API HIT =====");
//   console.log("BODY:", req.body);

//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     } = req.body;

//     console.log("Order ID:", razorpay_order_id);
//     console.log("Payment ID:", razorpay_payment_id);
//     console.log("Signature:", razorpay_signature);

//     const isValid = verifySignature(
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature
//     );

//     console.log("Signature valid?", isValid);

//     if (!isValid) {
//       console.error("❌ Signature verification failed");

//       await Payment.findOneAndUpdate(
//         { razorpayOrderId: razorpay_order_id },
//         { status: "FAILED" }
//       );

//       return res.status(400).json({ success: false });
//     }

//     const updated = await Payment.findOneAndUpdate(
//       { razorpayOrderId: razorpay_order_id },
//       {
//         paymentId: razorpay_payment_id,
//         status: "SUCCESS",
//       },
//       { new: true }
//     );

//     console.log("✅ Payment verified & updated:", updated);

//     res.json({ success: true, message: "Payment verified" });
//   } catch (err) {
//     console.error("❌ VERIFY PAYMENT ERROR:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * =========================
//  * VERIFY RAZORPAY SIGNATURE
//  * =========================
//  */
// function verifySignature(orderId, paymentId, signature) {
//   const body = `${orderId}|${paymentId}`;

//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//     .update(body)
//     .digest("hex");

//   console.log("Expected Signature:", expectedSignature);

//   return expectedSignature === signature;
// }

// /**
//  * =========================
//  * RAZORPAY WEBHOOK
//  * =========================
//  */
// export const razorpayWebhook = async (req, res) => {
//   console.log("===== RAZORPAY WEBHOOK HIT =====");
//   console.log("HEADERS:", req.headers);
//   console.log("BODY:", JSON.stringify(req.body, null, 2));

//   try {
//     const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
//     const signature = req.headers["x-razorpay-signature"];

//     console.log("Webhook signature received:", signature);

//     const generatedSignature = crypto
//       .createHmac("sha256", secret)
//       .update(JSON.stringify(req.body))
//       .digest("hex");

//     console.log("Generated signature:", generatedSignature);

//     if (generatedSignature !== signature) {
//       console.error("❌ Invalid webhook signature");
//       return res.status(400).json({ message: "Invalid signature" });
//     }

//     const event = req.body.event;
//     const paymentEntity = req.body.payload.payment.entity;

//     console.log("Webhook event:", event);
//     console.log("Payment entity:", paymentEntity);

//     if (event === "payment.captured") {
//       // 1️⃣ Update payment
//       const payment = await Payment.findOneAndUpdate(
//         { razorpayOrderId: paymentEntity.order_id },
//         { paymentId: paymentEntity.id, status: "SUCCESS" },
//         { new: true }
//       );

//       console.log("✅ Payment marked SUCCESS:", payment);

//       // 2️⃣ CREATE FINAL ORDER (THIS IS WHAT YOU WANT)
//       const finalOrder = await Order.create({
//         userId: payment.userId,
//         uniqueId: crypto.randomUUID(),
//         reward: 0,
//         address: payment.address,     // or fetch from user
//         payments: [
//           { code: "svc", amount: payment.amount }
//         ],
//         refno: "GB" + Date.now(),
//         syncOnly: true,
//         deliveryMode: "API",
//         products: payment.products,   // pass from frontend earlier
//         paymentId: payment.paymentId,
//         razorpayOrderId: payment.razorpayOrderId,
//         status: "SUCCESS"
//       });

//       console.log("🎉 FINAL ORDER CREATED:", finalOrder);
//     }


//     if (event === "payment.failed") {
//       const updated = await Payment.findOneAndUpdate(
//         { razorpayOrderId: paymentEntity.order_id },
//         { status: "FAILED" },
//         { new: true }
//       );
//       console.log("❌ Payment marked FAILED:", updated);
//     }

//     res.json({ received: true });
//   } catch (err) {
//     console.error("❌ WEBHOOK ERROR:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * =========================
//  * SAVE GIFT CARD ORDER
//  * =========================
//  */
// export const saveGiftCardOrder = async (req, res) => {
//   console.log("===== SAVE GIFT CARD ORDER HIT =====");
//   console.log("BODY:", JSON.stringify(req.body, null, 2));

//   try {
//     const { goldbeeResponse } = req.body;

//     console.log("Goldbee response:", goldbeeResponse);

//     const order = await Order.create({
//       refno: goldbeeResponse.refno,
//       cardNumber: goldbeeResponse.cardDetails?.[0]?.cardNumber,
//       cardPin: goldbeeResponse.cardDetails?.[0]?.cardPin,
//       status: goldbeeResponse.status,
//       fullResponse: goldbeeResponse,
//     });

//     console.log("✅ Gift card order saved:", order);

//     res.json({ success: true });
//   } catch (err) {
//     console.error("❌ SAVE GIFT CARD ERROR:", err);
//     res.status(500).json({ error: err.message });
//   }
// };



import razorpay from "../config/razorpayClient.js"
import Payment from "../models/Payment.js";
import { verifySignature} from "../utils/verifyRazorpaySignature.js"
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
  console.log("🔥 RAZORPAY WEBHOOK RECEIVED 🔥");
  console.log("Time:", new Date().toISOString());
  console.log("HEADERS:", req.headers);
  console.log("BODY:", JSON.stringify(req.body, null, 2));
  console.log("==================================");

  try {
    console.log("👉 Event from Razorpay:", req.body.event);

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    console.log("Webhook secret loaded:", !!secret);

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

    console.log("✅ Webhook processing completed");
    res.json({ received: true });

  } catch (err) {
    console.error("🔥 WEBHOOK ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
