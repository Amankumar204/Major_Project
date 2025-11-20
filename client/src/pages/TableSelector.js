import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ import navigation hook
import "../styles/TableSelector.css";

const TableSelector = () => {
  const totalTables = Array.from({ length: 9 }, (_, i) => i + 1);
  const [occupiedTables] = useState([3, 7]);
  const [selectedTables, setSelectedTables] = useState([]);
  const navigate = useNavigate(); // ✅ initialize navigation

  const handleClick = (table) => {
    if (occupiedTables.includes(table)) return;
    setSelectedTables((prev) =>
      prev.includes(table)
        ? prev.filter((t) => t !== table)
        : [...prev, table]
    );
  };

  const getColor = (table) => {
    if (occupiedTables.includes(table)) return "#f87171"; // red
    if (selectedTables.includes(table)) return "#60a5fa"; // blue
    return "#86efac"; // green
  };

  const handleConfirm = () => {
    // Optional: prevent navigation if no table selected
    if (selectedTables.length === 0) {
      alert("Please select at least one table before proceeding!");
      return;
    }

    // ✅ Navigate to Assistant page and optionally pass selected tables
    navigate("/assistant", { state: { selectedTables } });
  };

  return (
    <div className="table-container">
      <div className="table-card">
        <h2 className="title">Choose Your Table</h2>

        <div className="table-grid">
          {totalTables.map((table) => (
            <div
              key={table}
              className="table-box"
              style={{ backgroundColor: getColor(table) }}
              onClick={() => handleClick(table)}
            >
              Table {table}
            </div>
          ))}
        </div>

        <button className="confirm-btn" onClick={handleConfirm}>
          Confirm Selection
        </button>

        <div className="info">
          <p><strong>Occupied:</strong> {occupiedTables.join(", ")}</p>
          <p><strong>Selected:</strong> {selectedTables.join(", ") || "None"}</p>
        </div>
      </div>
    </div>
  );
};

export default TableSelector;
