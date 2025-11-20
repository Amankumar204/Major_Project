const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  const { name, phone, password, role } = req.body;
  try {
    if (await User.findOne({ phone })) return res.status(400).json({ msg: 'Phone exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, phone, passwordHash, role });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) { res.status(500).json({ err: err.message }); }
});

// Login
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    console.log("Hello broooooooo!!!!!!!!!");
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    const ok = (password===user.password);
    if (!ok) return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) { res.status(500).json({ err: err.message }); }
});

module.exports = router;
