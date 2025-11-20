import React, { useEffect, useState } from "react";
import API from "../api";
import useSocket from "../hooks/useSocket";

export default function WaiterDashboard() {
  const [orders, setOrders] = useState([]);
  const socketRef = useSocket();

  useEffect(() => {
    fetchOrders();

    const socket = socketRef.current;
    if (!socket) return;
    socket.on("orderUpdated", () => fetchOrders());
    socket.on("orderAccepted", () => fetchOrders());
    return () => {
      socket.off("orderUpdated");
      socket.off("orderAccepted");
    };
  }, []);

  async function fetchOrders() {
    const res = await API.get("/orders");
    setOrders(res.data);
  }

  async function markServed(id) {
    await API.post(`/orders/status/${id}`, { status: "served" });
    fetchOrders();
  }

  async function markPaid(id) {
    await API.post(`/orders/status/${id}`, { status: "paid" });
    fetchOrders();
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Waiter Dashboard</h2>

      {orders.length === 0 && (
        <p className="text-center text-gray-500">No active orders.</p>
      )}

      <div className="grid gap-4">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white rounded-xl shadow p-4 hover:shadow-md transition"
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-semibold">
                  Table {order.table?.number} — #{order._id.slice(-5)}
                </h3>
                <p className="text-sm text-gray-500">
                  Status: {order.status.toUpperCase()}
                </p>
              </div>
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                ₹{order.total}
              </span>
            </div>

            <ul className="ml-4 list-disc text-sm text-gray-700">
              {order.items.map((it) => (
                <li key={it._id}>
                  {it.menuItem.name} × {it.qty}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex gap-3">
              {order.status === "ready" && (
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded"
                  onClick={() => markServed(order._id)}
                >
                  Mark Served
                </button>
              )}
              {order.status === "served" && (
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded"
                  onClick={() => markPaid(order._id)}
                >
                  Mark Paid
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
