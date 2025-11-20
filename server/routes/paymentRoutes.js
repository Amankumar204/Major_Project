const express = require("express");
const Razorpay = require("razorpay");
const shortid = require("shortid");
const router = express.Router();

const Order = require("../models/Order");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,       // put in .env
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create a payment order
router.post("/create-order", async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const payment_capture = 1;
    const amount = Math.round(order.totalCost * 100); // INR → paisa

    const options = {
      amount,
      currency: "INR",
      receipt: shortid.generate(),
      payment_capture,
    };

    const response = await razorpay.orders.create(options);

    res.json({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
      key: process.env.RAZORPAY_KEY_ID,
      orderId: orderId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment order creation failed" });
  }
});

// Verify and mark order as paid
router.post("/verify", async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;
    const order = await Order.findByIdAndUpdate(orderId, { status: "paid" }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to verify payment" });
  }
});

module.exports = router;
