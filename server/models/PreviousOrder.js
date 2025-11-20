const mongoose = require("mongoose");

const previousOrderSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    userEmail: String,
    tableNo: String,
    items: Array,
    totalCost: Number,
    status: String,
    createdAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PreviousOrder", previousOrderSchema);
