const express = require('express');
const router = express.Router();
const Cook = require('../models/Cook');
const Waiter = require('../models/Waiter');
// const bcrypt = require('bcrypt'); // uncomment if you plan to hash

// POST /auth/staff-signup
router.post('/staff-signup', async (req, res) => {
  try {
    const { name, phone, email, role, password } = req.body;

    if (!['cook', 'waiter'].includes(role)) {
      return res.status(400).json({ message: 'role must be "cook" or "waiter"' });
    }

    // const hashed = await bcrypt.hash(password, 10); // if hashing
    const payload = { name, phone, email, role, password /*: hashed*/ };

    if (role === 'cook') {
      const exists = await Cook.findOne({ phone });
      if (exists) return res.status(400).json({ message: 'Cook already exists' });
      const doc = await Cook.create(payload);
      return res.status(201).json({ message: 'Cook created', user: doc });
    } else {
      const exists = await Waiter.findOne({ phone });
      if (exists) return res.status(400).json({ message: 'Waiter already exists' });
      const doc = await Waiter.create(payload);
      return res.status(201).json({ message: 'Waiter created', user: doc });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /auth/staff-login
router.post('/staff-login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    // look in cooks first, then waiters
    let user = await Cook.findOne({ phone });
    let from = 'cook';
    if (!user) { user = await Waiter.findOne({ phone }); from = 'waiter'; }
    if (!user) return res.status(400).json({ message: 'Staff not found' });

    // const ok = await bcrypt.compare(password, user.password); // if hashing
    const ok = password === user.password; // plain compare (match your current setup)
    if (!ok) return res.status(400).json({ message: 'Invalid password' });

    // Issue token if you have JWT logic; for now send dummy token
    const token = 'dummy-staff-token';
    res.json({ token, user: { _id: user._id, name: user.name, phone: user.phone, role: from } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
