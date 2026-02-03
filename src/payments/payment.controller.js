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
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body) // RAW BUFFER
      .digest("hex");

    if (generatedSignature !== signature) {
      console.error("❌ SIGNATURE MISMATCH — ignored");
      return res.status(200).json({ ok: true }); // Razorpay retry-safe
    }

    console.log("✅ Signature verified");

    const event = JSON.parse(req.body.toString());

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      // 1️⃣ UPDATE PAYMENT STATUS
      const paymentDoc = await Payment.findOneAndUpdate(
        { orderId: payment.order_id },
        {
          paymentId: payment.id,
          status: "SUCCESS",
        },
        { new: true }
      );

      if (!paymentDoc) {
        console.error("❌ Payment document not found");
        return res.status(200).json({ ok: true });
      }

      // 2️⃣ CALL GOLDBEE API
      const goldbeeResponse = await fetch(
        "https://api.goldbee.in/api/admin/giftcard/giftcard/place-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GOLDBEE_TOKEN}`,
          },
          body: JSON.stringify({
            uniqueId: payment.id,
            reward: 0,
            address: {
              firstname: "phani",
              lastname: "gorantla",
              email: "phanigorantla531@gmail.com",
              telephone: "+918801648801",
              line1: "123 Street Name",
              line2: "Apt 456",
              city: "Mumbai",
              region: "MH",
              country: "IN",
              postcode: "400001",
              company: "GoldBee",
              billToThis: true,
            },
            payments: [{ code: "svc", amount: paymentDoc.amount }],
            refno: "GB" + Date.now(),
            syncOnly: true,
            deliveryMode: "API",
            products: [
              {
                sku: "EGCGBAMZFV002",
                price: paymentDoc.amount,
                qty: 1,
                currency: "356",
                theme: "",
              },
            ],
          }),
        }
      );

      const cards = await goldbeeResponse.json();

      // 3️⃣ SAVE CARD DETAILS
      await Order.create({
        orderId: payment.order_id,
        paymentId: payment.id,
        cards,
        userId: paymentDoc.userId,
      });

      console.log("🎁 Gift card created & saved");
    }

    return res.json({ received: true });

  } catch (err) {
    console.error("🔥 WEBHOOK ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};
