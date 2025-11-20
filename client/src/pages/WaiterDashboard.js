import React, { useState, useEffect, useCallback, useMemo } from "react";
import API from "../api";
import { menu } from "../data/menu"; // local static menu
import "../styles/WaiterDashboard.css";

export default function WaiterDashboard() {
  // ----- Ready orders list -----
  const [readyOrders, setReadyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const norm = (s) => String(s || "").toLowerCase();

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const res = await API.get("/orders");
      const list = Array.isArray(res.data?.orders) ? res.data.orders :
                   Array.isArray(res.data) ? res.data : [];
      const ready = list
        .filter((o) => norm(o.status) === "ready")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReadyOrders(ready);
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 15000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const markServed = async (orderId) => {
    try {
      await API.patch(`/orders/${orderId}/status`, { status: "served" });
      setReadyOrders((prev) => prev.filter((o) => o._id !== orderId));
    } catch (e) {
      console.error(e);
      alert("Failed to mark order as served");
    }
  };

  // ----- Manual order drawer -----
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cart, setCart] = useState([]); // [{name, price, qty}]
  const [email, setEmail] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [placing, setPlacing] = useState(false);

  const normalizedMenu = useMemo(() => {
    const toRow = (i) => ({ name: i.name, price: Number(i.price) || 0, description: i.description || "" });
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
  const inc = (name) => setCart((p) => p.map((it) => (it.name === name ? { ...it, qty: it.qty + 1 } : it)));
  const dec = (name) =>
    setCart((p) =>
      p.map((it) => (it.name === name ? { ...it, qty: it.qty - 1 } : it)).filter((it) => it.qty > 0)
    );
  const removeItem = (name) => setCart((p) => p.filter((it) => it.name !== name));
  const totalCost = cart.reduce((s, it) => s + it.price * it.qty, 0);

const placeManualOrder = async (e) => {
  e.preventDefault();
  if (!email || !tableNo || cart.length === 0) {
    alert("Please enter email, table number, and add at least one item.");
    return;
  }
  try {
    setPlacing(true);

    // Expand to an array of names, repeating by qty
    const items = cart.flatMap((it) =>
      Array.from({ length: it.qty }).map(() => it.name)
    );

    const totalCost = cart.reduce((sum, it) => sum + it.price * it.qty, 0);

    await API.post("/orders/create", {
      email,
      tableNo,
      items,       // ✅ ["Paneer Tikka", "Dal Tadka", ...]
      totalCost,   // ✅ number
    });

    alert("✅ Manual order placed!");
    setCart([]); setEmail(""); setTableNo("");
  } catch (e) {
    console.error("Error placing manual order:", e);
    const msg = e?.response?.data?.message || e.message || "Failed to place order";
    alert(msg);
  } finally {
    setPlacing(false);
  }
};
  return (
    <div className="waiter-wrap">
      {/* Header */}
      <div className="waiter-header">
        <h1>🍽️ Waiter Dashboard</h1>
        <div className="actions">
          <button onClick={fetchOrders} disabled={loadingOrders}>
            {loadingOrders ? "Refreshing..." : "Refresh Ready Orders"}
          </button>
          <button className="primary" onClick={() => setDrawerOpen(true)}>
            ➕ Place Manual Order
          </button>
        </div>
      </div>

      {/* Ready Orders */}
      <section>
        <h2>Ready for Serving</h2>
        {loadingOrders && <div className="waiter-card">Loading ready orders…</div>}
        {!loadingOrders && readyOrders.length === 0 && (
          <div className="waiter-card">No ready orders right now 🎉</div>
        )}

        <div className="orders-grid">
          {readyOrders.map((o) => (
            <div key={o._id} className="order-card">
              <div className="order-head">
                <div className="order-id">#{o._id.slice(-6)}</div>
                <div className="status pill ready">{o.status}</div>
              </div>
              <div className="meta">
                <div>
                  <strong>Table:</strong> {o.tableNo || "N/A"}
                </div>
                <div>
                  <strong>Placed:</strong>{" "}
                  {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                </div>
                {o.userEmail && (
                  <div>
                    <strong>Email:</strong> {o.userEmail}
                  </div>
                )}
              </div>
              <div className="items">
                <strong>Items:</strong>
                <ul>
                  {(o.items || []).map((it, idx) => (
                    <li key={idx}>{it.name || JSON.stringify(it)}</li>
                  ))}
                </ul>
              </div>
              <div className="actions">
                <button onClick={() => markServed(o._id)}>✅ Mark Served</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Drawer (full menu + cart + order form) */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => !placing && setDrawerOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>📝 Manual Order</h2>
              <button onClick={() => !placing && setDrawerOpen(false)}>✖</button>
            </div>

            <div className="drawer-content">
              <div className="drawer-columns">
                {/* Menu */}
                <div className="drawer-menu">
                  <MenuSection title="🍽️ Starters" items={normalizedMenu.starters} onAdd={addToCart} />
                  <MenuSection title="🥘 Main Course" items={normalizedMenu.maincourse} onAdd={addToCart} />
                  <MenuSection title="🍰 Desserts" items={normalizedMenu.desserts} onAdd={addToCart} />
                </div>

                {/* Cart + form */}
                <div className="drawer-cart">
                  <div className="cart-card">
                    <h3>🧺 Cart</h3>
                    {cart.length === 0 ? (
                      <div className="muted">No items yet</div>
                    ) : (
                      <ul className="cart-list">
                        {cart.map((it) => (
                          <li key={it.name} className="cart-row">
                            <div className="cart-name">{it.name}</div>
                            <div className="cart-controls">
                              <button onClick={() => dec(it.name)}>-</button>
                              <span className="qty">{it.qty}</span>
                              <button onClick={() => inc(it.name)}>+</button>
                              <button className="remove" onClick={() => removeItem(it.name)}>✖</button>
                            </div>
                            <div className="cart-line">₹{(it.price * it.qty).toFixed(2)}</div>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="cart-total">
                      <span>Total</span>
                      <strong>₹{totalCost.toFixed(2)}</strong>
                    </div>

                    <form className="place-form" onSubmit={placeManualOrder}>
                      <label>
                        Email *
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="customer@example.com"
                        />
                      </label>
                      <label>
                        Table No *
                        <input
                          type="text"
                          required
                          value={tableNo}
                          onChange={(e) => setTableNo(e.target.value)}
                          placeholder="e.g., T1"
                        />
                      </label>

                      <button type="submit" disabled={placing || cart.length === 0}>
                        {placing ? "Placing..." : "Place Order"}
                      </button>
                      <p className="muted small">
                        New orders are created with status <code>Requested</code>.
                      </p>
                    </form>
                  </div>
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
  return (
    <div className="menu-section">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <div className="muted">No items.</div>
      ) : (
        <div className="menu-grid">
          {items.map((item) => (
            <div key={item.name} className="menu-card">
              <div className="menu-top">
                <div className="menu-name">{item.name}</div>
                <div className="menu-price">₹{(item.price || 0).toFixed(2)}</div>
              </div>
              {item.description && <div className="menu-desc">{item.description}</div>}
              <button className="add-btn" onClick={() => onAdd(item.name, item.price)}>Add to Cart</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
