require('dotenv').config();
const express = require('express');
const http = require('http');
const connectDB = require('./config/db');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const User = require('./models/User');
const Table = require('./models/Table');
const Order = require('./models/Order'); // <-- used for socket snapshot & GET /api/orders/:id
const stripeRoutes = require("./routes/stripePayment");


// Routers
const requestRoutes = require("./routes/requestRoutes");
const staffDirectoryRoutes = require("./routes/staffDirectory");
const menuRoutes = require("./routes/menuRoutes");

// --- middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// --- socket.io
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }
});
app.set('io', io);

// normalize order status to the 5 steps used by the client tracker
function normalizeStatus(s) {
  const x = String(s || '').toLowerCase();
  if (x === 'requested' || x === 'waiting' || x === 'pending') return 'waiting';
  if (x === 'accepted') return 'accepted';
  if (x === 'preparing') return 'preparing';
  if (x === 'ready' || x === 'cooked') return 'cooked';
  if (x === 'served' || x === 'completed') return 'served';
  return 'waiting';
}

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  // optional: keep your table rooms
  socket.on('joinTableRoom', (tableId) => {
    socket.join(`table_${tableId}`);
  });

  // NEW: per-order subscription for AfterOrder screen
  socket.on('order:subscribe', async ({ orderId }) => {
    if (!orderId) return;
    const room = `order_${orderId}`;
    socket.join(room);

    // send an initial snapshot immediately
    try {
      const ord = await Order.findById(orderId);
      if (ord) {
        io.to(room).emit('order:update', {
          status: normalizeStatus(ord.status),
          etaSeconds: typeof ord.etaSeconds === 'number' ? ord.etaSeconds : null
        });
      }
    } catch (e) {
      console.error('order:subscribe snapshot error', e);
    }
  });

  socket.on('order:unsubscribe', ({ orderId }) => {
    if (!orderId) return;
    socket.leave(`order_${orderId}`);
  });

  // waiter bell
  socket.on('callWaiter', ({ tableId, orderId }) => {
    // broadcast to table room (frontends can listen & notify)
    io.to(`table_${tableId}`).emit('waiter:called', { tableId, orderId });
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

// --- routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tables', require('./routes/tables'));

// NOTE: you mounted /api/menu twice before. Keep only what you need.
// If ./routes/menu contains base menu endpoints and menuRoutes holds /items etc.
// you can keep both, but *avoid overlapping paths*. Example:
//   - ./routes/menu -> /api/menu (legacy endpoints)
//   - ./routes/menuRoutes -> /api/menu (new endpoints like /items, /items/add)
// If both export distinct subpaths it’s fine. Otherwise remove one.
app.use('/api/menu', require('./routes/menu'));
app.use('/api/auth', require('./routes/staff'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/requests', requestRoutes);
app.use('/api/admin', require('./routes/adminAuth'));
app.use('/api/auth', staffDirectoryRoutes);
app.use('/api/menu', menuRoutes);
app.use("/api/payment", stripeRoutes);
app.use("/api/feedbacks", require("./routes/feedbackRoutes"));


// background: clear expired holds every 30s
setInterval(async () => {
  const now = new Date();
  const expired = await Table.find({ status: 'held', holdExpiresAt: { $lte: now } });
  for (const t of expired) {
    t.status = 'available';
    t.heldBy = null;
    t.holdExpiresAt = null;
    await t.save();
    io.emit('tableReleased', { tableId: t._id });
  }
}, 30 * 1000);

// simple user signup (unchanged)
app.post("/signup", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });
    const newUser = new User({ name, phone, email, password });
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// --- start
const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI).then(() => {
  server.listen(PORT, () => console.log('Server running on', PORT));
});
