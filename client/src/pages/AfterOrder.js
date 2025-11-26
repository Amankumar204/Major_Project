import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_API_BASE || "http://localhost:5000", {
  transports: ["websocket"],
});

const STATUSES = ["waiting", "accepted", "preparing", "cooked", "served"];
const STATUS_LABEL = {
  waiting: "Waiting for Cook to Accept",
  accepted: "Accepted",
  preparing: "Preparing",
  cooked: "Cooked",
  served: "Served",
};

export default function AfterOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId || null;
  const tableId = localStorage.getItem("tableId") || "walkin";

  const [status, setStatus] = useState("waiting");
  const [etaSeconds, setEtaSeconds] = useState(null);
  const [initialEta, setInitialEta] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    socket.emit("order:subscribe", { orderId });

    const handleUpdate = (data) => {
      if (data?.status) setStatus(data.status);
      if (typeof data?.etaSeconds === "number") {
        setEtaSeconds(data.etaSeconds);
        setInitialEta(data.etaSeconds);
      }
    };

    socket.on("order:update", handleUpdate);
    socket.on("orderServed", () => setStatus("served"));

    return () => {
      socket.emit("order:unsubscribe", { orderId });
      socket.off("order:update", handleUpdate);
      socket.off("orderServed");
    };
  }, [orderId]);

  useEffect(() => {
    if (etaSeconds == null || etaSeconds <= 0) return;
    const t = setInterval(() => {
      setEtaSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [etaSeconds]);

  const etaStr = useMemo(() => {
    if (etaSeconds == null) return "—";
    const m = Math.floor(etaSeconds / 60);
    const s = etaSeconds % 60;
    return `${m}m ${s}s`;
  }, [etaSeconds]);

  const stepIndex = STATUSES.indexOf(status);
  const progress = Math.round((stepIndex / (STATUSES.length - 1)) * 100);

  const handleOrderMore = () => navigate("/");
  const handleProceedToBill = () =>
    navigate("/bill", { state: { orderId } });
  const callWaiter = () => {
    socket.emit("callWaiter", { tableId, orderId });
    alert("🛎️ Waiter has been notified!");
  };

  return (
    <div className="ao-container">
      <div className="ao-box">
        <h1 className="ao-title">🍜 Order Placed!</h1>
        <p className="ao-subtitle">Track your food in real time</p>

        <div className="ao-vertical-tracker">
          {STATUSES.map((s, i) => (
            <div
              key={s}
              className={`ao-step-vertical ${
                i < stepIndex ? "done" : i === stepIndex ? "current" : ""
              }`}
            >
              <div className="ao-circle" />
              <span className="ao-label">{STATUS_LABEL[s]}</span>
              {s === "preparing" && status === "preparing" && (
                <span className="ao-chip">⏱ ETA: {etaStr}</span>
              )}
            </div>
          ))}
        </div>

        <div className="ao-progressbar">
          <div
            className="ao-progressfill"
            style={{ height: `${progress}%` }}
          ></div>
        </div>

        <div className="ao-btns">
          <button className="ao-btn secondary" onClick={handleOrderMore}>
            ➕ Additional Order
          </button>
          <button className="ao-btn outline" onClick={callWaiter}>
            🛎️ Call Waiter
          </button>
          <button
            className="ao-btn primary"
            onClick={handleProceedToBill}
            disabled={status !== "served"}
          >
            💳 Proceed to Bill
          </button>
        </div>

        <p className="ao-note">
          {status === "waiting"
            ? "Waiting for cook to accept your order..."
            : status === "served"
            ? "Your food is served! Enjoy your meal 😋"
            : "Your food is being prepared..."}
        </p>
      </div>
    </div>
  );
}
