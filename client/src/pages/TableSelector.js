import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "../styles/TableSelector.css";

const TableSelector = () => {
  const [tables, setTables] = useState([]);            // all tables from DB
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);  // selected table _ids
  const navigate = useNavigate();

  // Load tables from backend
  useEffect(() => {
    const loadTables = async () => {
      try {
        const res = await API.get("/tables"); // GET route you already have
        setTables(res.data);                  // [{ _id, number, status, ... }]
      } catch (err) {
        console.error("Failed to load tables", err);
        alert("Failed to load tables.");
      } finally {
        setLoading(false);
      }
    };

    loadTables();
  }, []);

  const handleClick = (table) => {
    // don't allow clicking already occupied tables
    if (table.status === "occupied") return;

    setSelectedIds((prev) =>
      prev.includes(table._id)
        ? prev.filter((id) => id !== table._id)
        : [...prev, table._id]
    );
  };

  const getColor = (table) => {
    if (table.status === "occupied") return "#f87171"; // red
    if (selectedIds.includes(table._id)) return "#60a5fa"; // blue
    return "#86efac"; // green
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one table before proceeding!");
      return;
    }

    try {
      // mark each selected table as occupied in DB
      await Promise.all(
        selectedIds.map((id) => API.post(`/tables/occupy/${id}`))
      );

      // optional: update local state so UI reflects new status
      setTables((prev) =>
        prev.map((t) =>
          selectedIds.includes(t._id)
            ? { ...t, status: "occupied" }
            : t
        )
      );

      // pass selected table numbers to Assistant
      const selectedTableNumbers = tables
        .filter((t) => selectedIds.includes(t._id))
        .map((t) => t.number);

      navigate("/assistant", {
        state: { selectedTables: selectedTableNumbers },
      });
    } catch (err) {
      console.error("Failed to occupy tables", err);
      alert("Failed to mark tables as occupied. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="table-container">
        <div className="table-card">
          <h2 className="title">Choose Your Table</h2>
          <p>Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-card">
        <h2 className="title">Choose Your Table</h2>

        <div className="table-grid">
          {tables.map((table) => (
            <div
              key={table._id}
              className="table-box"
              style={{ backgroundColor: getColor(table) }}
              onClick={() => handleClick(table)}
            >
              Table {table.number}
            </div>
          ))}
        </div>

        <button className="confirm-btn" onClick={handleConfirm}>
          Confirm Selection
        </button>

        <div className="info">
          <p>
            <strong>Occupied:</strong>{" "}
            {tables
              .filter((t) => t.status === "occupied")
              .map((t) => t.number)
              .join(", ") || "None"}
          </p>
          <p>
            <strong>Selected:</strong>{" "}
            {tables
              .filter((t) => selectedIds.includes(t._id))
              .map((t) => t.number)
              .join(", ") || "None"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TableSelector;
