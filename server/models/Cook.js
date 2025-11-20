const mongoose = require('mongoose');

const cookSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    role: { type: String, default: 'cook' }, // fixed
    password: { type: String, required: true }, // (store hashed in real apps)
  },
  { timestamps: true }
);

// third arg sets the collection name explicitly → "cooks"
module.exports = mongoose.model('Cook', cookSchema, 'cooks');
