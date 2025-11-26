import React, { useEffect, useState, useCallback } from "react";
import API from "../api";


export default function CookDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // New: dish request modal state
  const [isReqOpen, setIsReqOpen] = useState(false);
  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const normalize = (s) => String(s || "").toLowerCase();

  // Fetch Requested + Preparing orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/orders");
      const list =
        Array.isArray(res.data?.orders) ? res.data.orders :
        Array.isArray(res.data) ? res.data :
        [];

      const current = list.filter((o) =>
        ["requested", "preparing"].includes(normalize(o.status))
      );

      current.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(current);
    } catch (e) {
      console.error("Failed to fetch orders", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 15000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  // Update order status
  const setStatus = async (orderId, nextStatus) => {
    try {
      await API.patch(`/orders/${orderId}/status`, { status: nextStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o))
      );
    } catch (e) {
      console.error(e);
      alert("Failed to update order status");
    }
  };

  // New: submit a dish request to MongoDB "requests" collection
  const submitDishRequest = async (e) => {
    e.preventDefault();
    if (!dishName.trim()) {
      alert("Please enter a dish name");
      return;
    }
    const priceNum = price === "" ? null : Number(price);
    if (price !== "" && (Number.isNaN(priceNum) || priceNum < 0)) {
      alert("Please enter a valid non-negative price");
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

      // Adjust endpoint if your backend differs (e.g., "/dish-requests")
      const res = await API.post("/requests", payload);

      // Reset form & close modal
      setDishName("");
      setCategory("");
      setPrice("");
      setNotes("");
      setIsReqOpen(false);

      // Optional: show success
      alert("Dish request submitted ✅");
      console.log("Dish request response:", res.status, res.data);
    } catch (err) {
      console.error("Failed to submit dish request:", err);
      alert("Failed to submit dish request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cook-wrap">
      <div className="cook-header">
        <h1>🍳 Cook Dashboard</h1>
        <div className="header-actions" style={{ display: "flex", gap: 8 }}>
          <button className="refresh-btn" onClick={fetchOrders} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          {/* New: Open dish request modal */}
          <button className="request-btn" onClick={() => setIsReqOpen(true)}>
            ➕ Request New Dish
          </button>
        </div>
      </div>

      {loading && <div className="cook-card">Loading orders…</div>}
      {!loading && orders.length === 0 && (
        <div className="cook-card">No requested or preparing orders 🎉</div>
      )}

      <div className="orders-grid">
        {orders.map((o) => {
          const status = normalize(o.status);
          return (
            <div key={o._id} className="order-card">
              <div className="order-head">
                <div className="order-id">#{o._id.slice(-6)}</div>
                <div className={`status pill ${status}`}>{o.status}</div>
              </div>

              <div className="meta">
                <div><strong>Table:</strong> {o.tableNo || "N/A"}</div>
                <div>
                  <strong>Placed:</strong>{" "}
                  {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                </div>
                {o.name && <div><strong>Name:</strong> {o.name}</div>}
              </div>

              <div className="items">
                <strong>Items:</strong>
                <ul>
                  {(o.items || []).map((it, idx) => (
                    <li key={idx}>
                      {typeof it === "string" ? it : it.name || JSON.stringify(it)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="actions">
                {status === "requested" && (
                  <button onClick={() => setStatus(o._id, "preparing")}>
                    Start Preparing
                  </button>
                )}
                {status === "preparing" && (
                  <button onClick={() => setStatus(o._id, "ready")}>
                    Mark Ready
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New: Dish Request Modal */}
      {isReqOpen && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => !submitting && setIsReqOpen(false)}
        >
          <div
            className="modal-card"
            style={{
              background: "#fff",
              minWidth: 360,
              maxWidth: 520,
              padding: 16,
              borderRadius: 12,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>Request New Dish</h2>
              <button onClick={() => !submitting && setIsReqOpen(false)} aria-label="Close">
                ✖
              </button>
            </div>

            <form onSubmit={submitDishRequest} className="dish-form" style={{ display: "grid", gap: 10 }}>
              <label>
                <div>Dish Name *</div>
                <input
                  type="text"
                  required
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g., Paneer Tikka"
                />
              </label>

              <label>
                <div>Category</div>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Starter / Main / Dessert"
                />
              </label>

              <label>
                <div>Price (₹)</div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g., 220"
                />
              </label>

              <label>
                <div>Notes</div>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or description"
                />
              </label>

              <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => !submitting && setIsReqOpen(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>

            <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
              This will be sent to the admin/manager for approval and saved in the <code>requests</code> collection.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
