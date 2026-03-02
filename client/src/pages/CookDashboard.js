import React, { useEffect, useState, useCallback } from "react";
import API from "../api";

export default function CookDashboard() {
  // --- STATE ---
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notification State
  const [notification, setNotification] = useState(null); // { message: string, type: 'success' | 'error' }

  // Modal State
  const [isReqOpen, setIsReqOpen] = useState(false);
  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Helper: Normalize Status
  const normalize = (s) => String(s || "").toLowerCase();

  // Helper: Show Notification
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // --- API: FETCH ORDERS ---
  const fetchOrders = useCallback(async () => {
    try {
      const res = await API.get("/orders");
      const list = Array.isArray(res.data?.orders)
        ? res.data.orders
        : Array.isArray(res.data)
        ? res.data
        : [];

      const current = list.filter((o) =>
        ["requested", "preparing"].includes(normalize(o.status))
      );

      current.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(current);
    } catch (e) {
      console.error("Failed to fetch orders", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 15000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  // --- API: UPDATE STATUS ---
  const setStatus = async (orderId, nextStatus) => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o))
      );

      // 🔧 FIXED TEMPLATE STRING
      await API.patch(`/orders/${orderId}/status`, { status: nextStatus });

      if (nextStatus === "ready") {
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
        showNotification("Order marked as ready!", "success");
      }
    } catch (e) {
      console.error(e);
      showNotification("Failed to update status", "error");
      fetchOrders();
    }
  };

  // --- API: SUBMIT REQUEST ---
  const submitDishRequest = async (e) => {
    e.preventDefault();
    if (!dishName.trim()) {
      showNotification("Please enter a dish name", "error");
      return;
    }
    const priceNum = price === "" ? null : Number(price);
    if (price !== "" && (Number.isNaN(priceNum) || priceNum < 0)) {
      showNotification("Please enter a valid price", "error");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        type: "dish",
        name: dishName.trim(),
        category: category.trim() || null,
        price: priceNum,
        notes: notes.trim() || null,
        requestedBy: "cook",
        createdAt: new Date().toISOString(),
      };

      await API.post("/requests", payload);

      // Reset
      setDishName("");
      setCategory("");
      setPrice("");
      setNotes("");
      setIsReqOpen(false);

      showNotification("Dish request submitted successfully!", "success");
    } catch (err) {
      console.error("Failed to submit request:", err);
      showNotification("Failed to submit dish request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const requestedOrders = orders.filter(
    (o) => normalize(o.status) === "requested"
  );
  const preparingOrders = orders.filter(
    (o) => normalize(o.status) === "preparing"
  );
  const bgImage =
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80";

  return (
    <div className="relative min-h-screen font-sans selection:bg-orange-500 selection:text-white overflow-hidden text-slate-100">
      {/* --- NOTIFICATION TOAST (Top of Screen) --- */}
      {notification && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down">
          <div
            className={`flex items-center gap-3 px-6 py-3 rounded-lg shadow-2xl border ${
              notification.type === "success"
                ? "bg-emerald-600/90 border-emerald-500 text-white"
                : "bg-red-600/90 border-red-500 text-white"
            } backdrop-blur-md min-w-[320px] max-w-md`}
          >
            {/* Icon */}
            <span className="text-xl">
              {notification.type === "success" ? "✅" : "⚠️"}
            </span>

            {/* Message */}
            <p className="flex-1 text-sm font-semibold tracking-wide">
              {notification.message}
            </p>

            {/* Close Button */}
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center blur-sm scale-105"
          // 🔧 FIXED backgroundImage TEMPLATE STRING
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[1px]"></div>
      </div>

      {/* --- CONTENT --- */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Navbar */}
        <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md shadow-sm shrink-0">
          <div className="max-w-full mx-auto px-6">
            <div className="flex justify-between items-center h-16">
              <div className="w-1/3 flex items-center gap-4">
                <div className="w-8 h-8 bg-orange-500/90 rounded-md flex items-center justify-center text-lg shadow-lg">
                  👨‍🍳
                </div>
                <button
                  onClick={fetchOrders}
                  disabled={loading}
                  className="text-xs font-mono text-slate-300 hover:text-white transition-colors flex items-center gap-2"
                >
                  {loading ? "Refreshing..." : "↻ REFRESH"}
                </button>
              </div>

              <div className="w-1/3 flex flex-col items-center justify-center">
                <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
                  Cook<span className="text-orange-500">Dashboard</span>
                </h1>
              </div>

              <div className="w-1/3 flex justify-end">
                <button
                  onClick={() => setIsReqOpen(true)}
                  className="bg-orange-600 hover:bg-orange-500 text-white text-sm px-4 py-1.5 rounded-md font-medium transition-all shadow-lg shadow-orange-600/30 hover:-translate-y-0.5"
                >
                  + Request Dish
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Board Grid */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
          {loading && orders.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 animate-pulse">
              Loading Orders...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
              {/* REQUESTED */}
              <section className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse box-shadow-[0_0_10px_orange]"></span>
                    New Requests
                  </h2>
                  <span className="bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded text-xs font-bold border border-orange-500/30">
                    {requestedOrders.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {requestedOrders.length === 0 && (
                    <div className="text-xs text-slate-500 italic p-2">
                      No new requests
                    </div>
                  )}
                  {requestedOrders.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      type="requested"
                      onAction={() => setStatus(order._id, "preparing")}
                    />
                  ))}
                </div>
              </section>

              {/* PREPARING */}
              <section className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 box-shadow-[0_0_10px_blue]"></span>
                    Preparing
                  </h2>
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs font-bold border border-blue-500/30">
                    {preparingOrders.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {preparingOrders.length === 0 && (
                    <div className="text-xs text-slate-500 italic p-2">
                      No orders in kitchen
                    </div>
                  )}
                  {preparingOrders.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      type="preparing"
                      onAction={() => setStatus(order._id, "ready")}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* --- MODAL --- */}
      {isReqOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => !submitting && setIsReqOpen(false)}
          ></div>

          <div
            className="relative bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2">
              Request New Dish
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              This sends a proposal to the admin menu.
            </p>

            <form onSubmit={submitDishRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Dish Name *
                </label>
                <input
                  type="text"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Paneer Tikka"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Starter"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions..."
                  rows="2"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => !submitting && setIsReqOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-bold uppercase tracking-wide"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20 transition-all text-sm font-bold uppercase tracking-wide disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CARD COMPONENT ---
function OrderCard({ order, type, onAction }) {
  const theme = {
    requested: {
      border: "border-l-orange-500",
      badge: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
      btn: "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-orange-500/40",
      btnText: "Start Cooking",
    },
    preparing: {
      border: "border-l-blue-500",
      badge: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
      btn: "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/40",
      btnText: "Mark Ready",
    },
  }[type];

  const timeString = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div
      className={`bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 border-l-[3px] ${theme.border}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-lg font-bold text-white leading-none drop-shadow-sm">
            #{order._id ? order._id.slice(-6) : "—"}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span>🕒 {timeString}</span>
            <span className="w-0.5 h-2 bg-slate-600"></span>
            <span>🍽️ {order.tableNo || "N/A"}</span>
          </div>
          {order.name && (
            <div className="text-xs text-slate-500 mt-1">
              Customer: {order.name}
            </div>
          )}
        </div>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${theme.badge}`}
        >
          {order.status}
        </span>
      </div>

      <div className="bg-slate-900/40 rounded p-2 mb-2 border border-white/5">
        <ul className="space-y-1">
          {(order.items || []).map((item, idx) => (
            <li
              key={idx}
              className="flex items-center text-slate-200 text-xs truncate"
            >
              <span className="w-1 h-1 bg-slate-500 rounded-full mr-1.5 shrink-0"></span>
              <span className="truncate">
                {typeof item === "string"
                  ? item
                  : item.name || "Unknown Item"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onAction}
        className={`w-full py-1.5 rounded text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md active:scale-[0.98] ${theme.btn}`}
      >
        {theme.btnText}
      </button>
    </div>
  );
}
