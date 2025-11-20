const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

function normalizeStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "requested" || s === "waiting" || s === "pending") return "waiting";
  if (s === "accepted") return "accepted";
  if (s === "preparing") return "preparing";
  if (s === "ready" || s === "cooked") return "cooked";
  if (s === "served" || s === "completed") return "served";
  return "waiting";
}

// CREATE order
router.post("/create", async (req, res) => {
  try {
    const { email, phone, items, totalCost, tableNo } = req.body;
    const newOrder = await Order.create({
      userEmail: email,
      phone,
      items,
      totalCost,
      tableNo,
      status: "requested",
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`order_${newOrder._id}`).emit("order:update", {
        status: normalizeStatus(newOrder.status),
      });
    }

    res.status(201).json({ message: "Order stored successfully", order: newOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to store order" });
  }
});

// GET all
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// GET one (full order)
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

// UPDATE status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const io = req.app.get("io");
    if (io) {
      io.to(`order_${order._id}`).emit("order:update", { status: normalizeStatus(order.status) });
    }

    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

// MARK served
router.patch("/:id/serve", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "served" },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    const io = req.app.get("io");
    if (io) {
      io.to(`order_${order._id}`).emit("order:update", { status: "served" });
    }

    res.json({ message: "Order served successfully", order });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark served" });
  }
});

const PreviousOrder = require("../models/PreviousOrder");

router.post("/:id/markPaid", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const prevOrder = await PreviousOrder.create({
      orderId: order._id,
      userEmail: order.userEmail,
      tableNo: order.tableNo,
      items: order.items,
      totalCost: order.totalCost,
      status: "paid",
      createdAt: order.createdAt,
    });

    res.status(201).json({ message: "Order moved to previous orders", prevOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to store in previous orders" });
  }
});

module.exports = router;
