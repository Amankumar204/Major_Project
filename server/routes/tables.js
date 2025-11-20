const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const auth = require('../middleware/auth');

// get all tables
router.get('/', async (req, res) => {
  const tables = await Table.find().sort('number');
  res.json(tables);
});

// hold/reserve a table (atomic update)
router.post('/hold/:id', auth, async (req, res) => {
  const { id } = req.params;
  const holdForMs = 2 * 60 * 1000; // 2 mins
  try {
    const now = new Date();
    const holdExpiresAt = new Date(now.getTime() + holdForMs);
    // only hold if available
    const result = await Table.findOneAndUpdate(
      { _id: id, status: 'available' },
      { status: 'held', heldBy: req.user._id, holdExpiresAt },
      { new: true }
    );
    if (!result) return res.status(400).json({ msg: 'Table not available' });
    // emit socket event (server will handle)
    req.app.get('io').emit('tableHeld', { tableId: id, heldBy: req.user._id });
    res.json(result);
  } catch (err) { res.status(500).json({ err: err.message }); }
});

// mark table occupied (customer arrived)
router.post('/occupy/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await Table.findOneAndUpdate(
      { _id: id, status: { $in: ['held','available'] } },
      { status: 'occupied', heldBy: null, holdExpiresAt: null },
      { new: true }
    );
    if (!updated) return res.status(400).json({ msg: 'Cannot occupy' });
    req.app.get('io').emit('tableOccupied', { tableId: id });
    res.json(updated);
  } catch (err) { res.status(500).json({ err: err.message }); }
});

module.exports = router;
