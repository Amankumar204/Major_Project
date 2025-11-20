const express = require("express");
const Stripe = require("stripe");
const router = express.Router();
const Order = require("../models/Order");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create checkout session
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const line_items = order.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: { name: typeof item === "string" ? item : item.name },
        unit_amount: (item.price || 150) * 100,
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: "http://localhost:3000/thank-you",
      cancel_url: "http://localhost:3000/bill?canceled=true",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ message: "Payment session creation failed" });
  }
});

module.exports = router;
