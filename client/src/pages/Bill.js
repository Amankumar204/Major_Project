import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import API from "../api";
import "../styles/Bill.css";

export default function Bill() {
  const { state } = useLocation();
  const orderId = state?.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const res = await API.get(`/orders/${orderId}`);
        const doc = res.data?.order ?? res.data;
        setOrder(doc || null);
      } catch (err) {
        console.error("Fetch order failed:", err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const total = useMemo(() => {
    if (!order) return 0;
    if (typeof order.totalCost === "number") return order.totalCost;
    if (Array.isArray(order.items)) return order.items.length * 150;
    return 0;
  }, [order]);

  if (!orderId) return <p className="bill-msg">No order selected.</p>;
  if (loading) return <p className="bill-msg">Loading bill…</p>;
  if (!order) return <p className="bill-msg">Order not found.</p>;

const handlePayment = async () => {
  try {
    const res = await API.post("/payment/create-checkout-session", { orderId });
    const url = res.data?.url;

    // store in previous orders before redirect
    await API.post(`/orders/${orderId}/markPaid`);

    if (url) window.location.href = url;
    else alert("Payment link not received.");
  } catch (e) {
    console.error(e);
    alert("Failed to initiate payment");
  }
};


  return (
    <div className="bill-container">
      <div className="bill-card">
        <h1 className="bill-title">💳 Your Bill</h1>

        <div className="bill-info">
          <div><strong>Email:</strong> {order.userEmail || "—"}</div>
          <div><strong>Table:</strong> {order.tableNo || "—"}</div>
          <div><strong>Status:</strong> {order.status || "—"}</div>
          <div>
            <strong>Placed:</strong>{" "}
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString()
              : "—"}
          </div>
        </div>

        <div className="bill-items">
          <h2>🍽️ Items Ordered</h2>
          <ul>
            {(order.items || []).map((it, i) => (
              <li key={i}>
                {typeof it === "string" ? it : it?.name ?? JSON.stringify(it)}
              </li>
            ))}
          </ul>
        </div>

        <div className="bill-total">
          <h2>Total Amount</h2>
          <p>₹{total}</p>
        </div>

        <button className="bill-btn" onClick={handlePayment}>
          Pay Now
        </button>
      </div>
    </div>
  );
}
