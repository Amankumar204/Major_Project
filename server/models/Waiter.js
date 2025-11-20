const mongoose = require('mongoose');

const waiterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    role: { type: String, default: 'waiter' }, // fixed
    password: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Waiter', waiterSchema, 'waiters');
