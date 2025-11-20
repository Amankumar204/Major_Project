// server/routes/staffDirectory.js
const express = require("express");
const router = express.Router();

// Use your existing models (note the filenames)
const Waiter = require("../models/Waiter"); // you already have this
const Cook   = require("../models/Cook");    // make sure this exists, or adjust the path/name

// Unified: /api/auth/staff?role=waiter|cook|chef
router.get("/staff", async (req, res) => {
  try {
    const role = String(req.query.role || "").toLowerCase();

    if (role === "waiter") {
      const list = await Waiter.find().sort({ createdAt: -1 });
      return res.json(list);
    }

    if (role === "cook" || role === "chef") {
      const list = await Cook.find().sort({ createdAt: -1 });
      return res.json(list);
    }

    return res.status(400).json({ message: "role must be waiter | cook | chef" });
  } catch (err) {
    console.error("fetch staff error:", err);
    res.status(500).json({ message: "Failed to fetch staff" });
  }
});

// Separate endpoints (optional)
router.get("/waiters", async (_req, res) => {
  try {
    const list = await Waiter.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch waiters" });
  }
});

router.get("/cooks", async (_req, res) => {
  try {
    const list = await Cook.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch cooks" });
  }
});

module.exports = router;
