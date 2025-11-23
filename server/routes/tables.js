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

// get list of occupied tables
router.get('/occupied', async (req, res) => {
  try {
    const occupiedTables = await Table.find({ status: 'occupied' }).sort('number');

    res.json({
      occupiedTables: occupiedTables.map(t => t.number),
    });
  } catch (err) {
    console.error("Occupied tables error:", err);
    res.status(500).json({ message: "Failed to fetch occupied tables" });
  }
});

// one-time: initialize tables 1–9 as available
router.post('/init', async (req, res) => {
  try {
    const existing = await Table.countDocuments();
    if (existing > 0) {
      return res.status(400).json({ msg: 'Tables already initialized' });
    }

    const tablesToCreate = Array.from({ length: 9 }, (_, i) => ({
      number: i + 1,
      status: 'available',
      heldBy: null,
      holdExpiresAt: null,
    }));

    const created = await Table.insertMany(tablesToCreate);
    res.json({ msg: 'Tables initialized', tables: created });
  } catch (err) {
    console.error('Table init error:', err);
    res.status(500).json({ msg: 'Failed to init tables', error: err.message });
  }
});
module.exports = router;
