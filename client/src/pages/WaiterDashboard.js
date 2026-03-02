import React, { useState, useEffect, useCallback, useMemo } from "react";
import API from "../api";
import { menu } from "../data/menu";
import { RefreshCw, Plus, Check, Clock, User, Utensils } from "lucide-react";

export default function WaiterDashboard() {
  const [readyOrders, setReadyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [email, setEmail] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const bgImage =
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80";

  const normalize = (s) => String(s || "").toLowerCase();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/orders");

      const list = Array.isArray(res.data?.orders)
        ? res.data.orders
        : Array.isArray(res.data)
        ? res.data
        : [];

      const ready = list
        .filter((o) => normalize(o.status) === "ready")
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );

      setReadyOrders(ready);
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 15000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const markServed = async (orderId) => {
    if (!window.confirm("Mark this order as served?")) return;
    try {
      await API.patch(`/orders/${orderId}/status`, { status: "served" });
      setReadyOrders((prev) => prev.filter((o) => o._id !== orderId));
    } catch (e) {
      console.error(e);
      alert("Failed to mark order as served");
    }
  };

  const normalizedMenu = useMemo(() => {
    const toRow = (i) => ({
      name: i.name,
      price: Number(i.price) || 0,
      description: i.description || "",
    });
    return {
      starters: (menu.starters || []).map(toRow),
      maincourse: (menu.maincourse || []).map(toRow),
      desserts: (menu.desserts || []).map(toRow),
    };
  }, []);

  const addToCart = (name, price) => {
    setCart((prev) => {
      const idx = prev.findIndex((it) => it.name === name);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { name, price: Number(price) || 0, qty: 1 }];
    });
  };

  const updateQty = (name, delta) => {
    setCart((prev) =>
      prev
        .map((it) => (it.name === name ? { ...it, qty: it.qty + delta } : it))
        .filter((it) => it.qty > 0)
    );
  };

  const removeItem = (name) => {
    setCart((prev) => prev.filter((it) => it.name !== name));
  };

  const totalCost = cart.reduce((s, it) => s + it.price * it.qty, 0);

  const placeManualOrder = async (e) => {
    e.preventDefault();
    if (!email || !tableNo || cart.length === 0) {
      alert("Please fill in Email, Table No, and add items.");
      return;
    }

    try {
      setSubmitting(true);
      const items = cart.flatMap((it) =>
        Array.from({ length: it.qty }).map(() => it.name)
      );

      await API.post("/orders/create", {
        email,
        tableNo,
        items,
        totalCost,
      });

      alert("✅ Order placed successfully!");
      setCart([]);
      setEmail("");
      setTableNo("");
      setIsPosOpen(false);
      fetchOrders();
    } catch (e) {
      console.error("Error placing order:", e);
      alert("Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative">
      {/* BACKGROUND WITH UNSPLASH IMAGE */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center blur-sm scale-105"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 bg-slate-950/90" />
      </div>

      {/* GLOW ORBS */}
      <div className="absolute top-20 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl animate-pulse-custom" />
      <div
        className="absolute bottom-40 left-10 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl animate-pulse-custom"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 animate-slide-down">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 hover:shadow-orange-500/60 transition-all duration-300 hover:scale-110 cursor-pointer group">
                <Utensils className="w-7 h-7 text-white group-hover:animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent animate-slide-right">
                  Waiter Dashboard
                </h1>
                <p
                  className="text-slate-300 text-sm mt-0.5 animate-slide-right"
                  style={{ animationDelay: "0.1s" }}
                >
                  Manage orders & serve customers
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 animate-slide-left">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="px-5 py-2.5 bg-slate-800/70 hover:bg-slate-700 border border-slate-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2 backdrop-blur-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() => setIsPosOpen(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60 transition-all duration-300 flex items-center gap-2 hover:scale-105 hover:-translate-y-0.5 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              New Order
            </button>
          </div>
        </div>

        {/* READY COUNT CHIP */}
        <div className="mb-6 animate-scale-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 border border-orange-500/40 rounded-full hover:border-orange-500/70 transition-all duration-300 backdrop-blur-sm">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse-custom"></div>
            <span className="text-orange-300 font-medium text-sm">
              {readyOrders.length} Orders Ready
            </span>
          </div>
        </div>

        {/* LOADING / EMPTY */}
        {loading && (
          <div className="flex justify-center items-center py-20 animate-fade-in">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-12 h-12 text-orange-400 animate-spin" />
              <p className="text-slate-300">Loading orders...</p>
            </div>
          </div>
        )}

        {!loading && readyOrders.length === 0 && (
          <div className="text-center py-20 bg-black/40 backdrop-blur-sm rounded-2xl border border-slate-700/70 animate-scale-in">
            <div className="animate-float">
              <Clock className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            </div>
            <p className="text-slate-200 text-lg">No orders ready to serve</p>
            <p className="text-slate-400 text-sm mt-2">
              New orders will appear here when ready
            </p>
          </div>
        )}

        {/* READY ORDERS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {readyOrders.map((o, idx) => (
            <div
              key={o._id}
              className="group bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-slate-700/60 hover:border-orange-500/60 p-6 flex flex-col hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-2 animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <span className="font-mono text-slate-400 text-sm">
                    Order
                  </span>
                  <div className="font-bold text-xl text-white mt-0.5 group-hover:text-orange-300 transition-colors duration-300">
                    #{o._id.slice(-6).toUpperCase()}
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase rounded-lg tracking-wide flex items-center gap-1.5 animate-bounce-slight">
                  <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse-custom"></div>
                  Ready
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3 text-slate-200 group-hover:text-slate-100 transition-colors duration-300">
                  <div className="w-8 h-8 bg-slate-800/70 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-lg">🍽️</span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">
                      Table
                    </div>
                    <div className="font-semibold">{o.tableNo || "N/A"}</div>
                  </div>
                </div>

                {o.userEmail && (
                  <div className="flex items-center gap-3 text-slate-200 group-hover:text-slate-100 transition-colors duration-300">
                    <div className="w-8 h-8 bg-slate-800/70 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-400 uppercase tracking-wider">
                        Customer
                      </div>
                      <div className="font-medium text-sm truncate">
                        {o.userEmail}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-slate-200 group-hover:text-slate-100 transition-colors duration-300">
                  <div className="w-8 h-8 bg-slate-800/70 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">
                      Time
                    </div>
                    <div className="font-medium text-sm">
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-slate-700/70 p-4 rounded-xl mb-5 group-hover:border-orange-500/40 transition-all duration-300">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>Order Items</span>
                  <span className="text-orange-300">
                    ({(o.items || []).length})
                  </span>
                </div>
                <ul className="space-y-2">
                  {(o.items || []).map((it, idx2) => (
                    <li
                      key={idx2}
                      className="flex items-center gap-2 text-slate-200 text-sm hover:text-slate-50 transition-colors duration-200"
                    >
                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full group-hover:animate-pulse-custom"></div>
                      <span>
                        {typeof it === "string"
                          ? it
                          : it.name || JSON.stringify(it)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {typeof o.totalCost === "number" && (
                <div className="flex justify-between items-center mb-5 pb-5 border-b border-slate-800/80">
                  <span className="text-slate-300 font-medium">
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold text-orange-300 group-hover:scale-110 transition-transform duration-300 origin-right">
                    ₹{o.totalCost}
                  </span>
                </div>
              )}

              <button
                onClick={() => markServed(o._id)}
                className="mt-auto w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 flex justify-center items-center gap-2 group-hover:scale-105 active:scale-95"
              >
                <Check className="w-5 h-5 group-hover:animate-bounce-slight" />
                Mark as Served
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* POS MODAL (unchanged from earlier except background already handled) */}
      {isPosOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !submitting && setIsPosOpen(false)}
        >
          <div
            className="bg-slate-900 w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-700 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Create New Order
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Select items and complete order details
                </p>
              </div>
              <button
                onClick={() => !submitting && setIsPosOpen(false)}
                className="w-10 h-10 bg-slate-700/50 hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
                <MenuSection
                  title="🥗 Starters"
                  items={normalizedMenu.starters}
                  onAdd={addToCart}
                />
                <MenuSection
                  title="🍝 Main Course"
                  items={normalizedMenu.maincourse}
                  onAdd={addToCart}
                />
                <MenuSection
                  title="🍰 Desserts"
                  items={normalizedMenu.desserts}
                  onAdd={addToCart}
                />
              </div>

              <div className="w-full md:w-[380px] bg-slate-800/80 backdrop-blur-sm border-l border-slate-700/50 flex flex-col shadow-2xl">
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-bold text-white text-lg">
                      Current Cart
                    </h3>
                    <div className="px-3 py-1 bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold rounded-lg animate-pulse-custom">
                      {cart.reduce((a, b) => a + b.qty, 0)} items
                    </div>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 animate-fade-in">
                      <div className="w-16 h-16 bg-slate-700/30 rounded-full mx-auto mb-3 flex items-center justify-center animate-float">
                        <span className="text-3xl">🛒</span>
                      </div>
                      <p className="font-medium">Cart is empty</p>
                      <p className="text-xs mt-1">Add items from menu</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {cart.map((it, idx) => (
                        <li
                          key={it.name}
                          className="bg-slate-900/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 flex justify-between items-center hover:border-orange-500/30 transition-all duration-300 group animate-slide-left hover:shadow-lg hover:shadow-orange-500/10"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <div className="font-semibold text-white text-sm group-hover:text-orange-300 transition-colors">
                              {it.name}
                            </div>
                            <div className="text-xs text-orange-300 font-medium mt-1">
                              ₹{(it.price * it.qty).toFixed(2)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-1 group-hover:bg-slate-700 transition-colors">
                            <button
                              onClick={() => updateQty(it.name, -1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 rounded font-bold transition-all active:scale-90"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold text-white w-6 text-center">
                              {it.qty}
                            </span>
                            <button
                              onClick={() => updateQty(it.name, 1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 rounded font-bold transition-all active:scale-90"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(it.name)}
                            className="ml-2 w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all hover:scale-110 active:scale-95"
                          >
                            <span className="text-xl">&times;</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-6 bg-slate-800/80 border-t border-slate-700/50 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
                  <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-700/50">
                    <span className="text-slate-300 font-medium text-lg">
                      Total
                    </span>
                    <span className="font-bold text-3xl bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent animate-pulse-custom">
                      ₹{totalCost.toFixed(2)}
                    </span>
                  </div>

                  <form onSubmit={placeManualOrder} className="space-y-3">
                    <input
                      type="email"
                      required
                      placeholder="Customer Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 focus:scale-[1.02] origin-bottom"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Table Number (e.g. T-1)"
                      value={tableNo}
                      onChange={(e) => setTableNo(e.target.value)}
                      className="w-full p-3.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 focus:scale-[1.02] origin-bottom"
                    />
                    <button
                      type="submit"
                      disabled={submitting || cart.length === 0}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 disabled:shadow-none transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-orange-500/50 hover:-translate-y-0.5 active:scale-95 disabled:hover:shadow-none"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Place Order
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuSection({ title, items, onAdd }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-10 animate-slide-up">
      <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-3 group cursor-default">
        <span className="group-hover:scale-110 transition-transform duration-300">
          {title}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent group-hover:from-orange-500/50 transition-colors duration-300"></div>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, idx) => (
          <div
            key={item.name}
            onClick={() => onAdd(item.name, item.price)}
            className="group cursor-pointer bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-orange-500/50 rounded-xl p-4 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 animate-slide-up"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-white leading-tight flex-1 group-hover:text-orange-300 transition-colors duration-300">
                {item.name}
              </span>
              <span className="text-orange-300 font-bold text-sm ml-2 whitespace-nowrap group-hover:text-orange-200 group-hover:scale-110 transition-all duration-300">
                ₹{item.price}
              </span>
            </div>
            {item.description && (
              <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed mb-3 group-hover:text-slate-100 transition-colors duration-300">
                {item.description}
              </p>
            )}
            <div className="mt-auto pt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 text-xs font-bold text-orange-300 uppercase tracking-wider text-center flex items-center justify-center gap-1 translate-y-1 group-hover:translate-y-0">
              <Plus className="w-3 h-3" />
              Add to Cart
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
