// src/pages/TableSelector.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Armchair,
  UsersRound,
  CheckCircle2,
  Ban,
  ArrowRight,
  LayoutGrid,
} from "lucide-react";
import API from "../api";

// ---------- ICON SETTINGS ----------
const ICON_SIZE = 26; // control icon size in one place
const commonImg = "w-9 h-9 sm:w-10 sm:h-10 object-contain";

const TableSelector = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const navigate = useNavigate();

  // Load tables from backend
  useEffect(() => {
    const loadTables = async () => {
      try {
        const res = await API.get("/tables");
        setTables(res.data);
      } catch (err) {
        console.error("Failed to load tables", err);
      } finally {
        setLoading(false);
      }
    };
    loadTables();
  }, []);

  const handleClick = (table) => {
    if (table.status === "occupied") return;

    setSelectedIds((prev) =>
      prev.includes(table._id)
        ? prev.filter((id) => id !== table._id)
        : [...prev, table._id]
    );
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return;

    try {
      await Promise.all(
        selectedIds.map((id) => API.post(`/tables/occupy/${id}`))
      );

      // Optimistic UI update
      setTables((prev) =>
        prev.map((t) =>
          selectedIds.includes(t._id) ? { ...t, status: "occupied" } : t
        )
      );

      const selectedTableNumbers = tables
        .filter((t) => selectedIds.includes(t._id))
        .map((t) => t.number);

      navigate("/assistant", {
        state: { selectedTables: selectedTableNumbers },
      });
    } catch (err) {
      console.error("Failed to occupy tables", err);
      alert("Failed to confirm tables. Please try again.");
    }
  };

  // ---------- ICON HELPER (smaller, uniform icons) ----------
  const getTableIcon = (seats, isOccupied) => {
    if (isOccupied) {
      return <Ban size={ICON_SIZE} className="text-white" />;
    }

    switch (seats) {
      case 1:
        return <Armchair size={ICON_SIZE} className="text-white" />;

      case 2:
        return (
          <img
            src="/two-seater.png"
            alt="2 seater table"
            className={commonImg}
          />
        );

      case 4:
        return (
          <img
            src="/four-seater.png"
            alt="4 seater table"
            className={commonImg}
          />
        );

      case 6:
        return (
          <img
            src="/six-seater.png"
            alt="6 seater table"
            className={commonImg}
          />
        );

      default:
        return <UsersRound size={ICON_SIZE} className="text-white" />;
    }
  };

  // Helper to calculate stats
  const totalTables = tables.length;
  const occupiedCount = tables.filter((t) => t.status === "occupied").length;
  const availableCount = totalTables - occupiedCount;
  const selectedCount = selectedIds.length;

  return (
    <div className="min-h-screen bg-[#020617] text-white relative font-sans selection:bg-orange-500 selection:text-white">
      {/* BACKGROUND */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#020617] to-[#020617]" />
      </div>

      {/* MAIN CONTAINER */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 h-screen flex flex-col">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/40">
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Floor Plan
              </h1>
            </div>
            <p className="text-sm font-medium text-slate-400 ml-1">
              Select available tables to seat guests
            </p>
          </div>

          {/* INLINE STATS */}
          <div className="flex items-end gap-10 text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase">
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-black text-green-400 leading-none">
                {availableCount}
              </span>
              <span className="mt-1 text-green-400/80">Available</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-black text-orange-400 leading-none">
                {selectedCount}
              </span>
              <span className="mt-1 text-orange-400/80">Selected</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-black text-red-400 leading-none">
                {occupiedCount}
              </span>
              <span className="mt-1 text-red-400/80">Occupied</span>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* TABLE GRID */}
        {!loading && (
          <div className="flex-1 overflow-y-auto pb-32 pr-1 custom-scrollbar">
            {/* fixed 5 columns */}
            <div className="grid grid-cols-5 gap-3 sm:gap-4">
              {tables.map((table) => {
                const isSelected = selectedIds.includes(table._id);
                const isOccupied = table.status === "occupied";

                // Neutral dark bg always; only border is tinted
                let cardClasses = "bg-slate-900/80 border border-slate-700";
                if (isOccupied)
                  cardClasses = "bg-slate-900/80 border border-red-500/80";
                else if (isSelected)
                  cardClasses = "bg-slate-900/80 border border-blue-500/80";
                else
                  cardClasses = "bg-slate-900/80 border border-green-500/60";

                // Status light color (top-right small dot)
                let statusDot = "bg-green-400"; // available
                if (isOccupied) statusDot = "bg-red-500";
                else if (isSelected) statusDot = "bg-orange-400";

                return (
                  <button
                    key={table._id}
                    onClick={() => handleClick(table)}
                    disabled={isOccupied}
                    className={`
                      relative px-2.5 py-3 sm:px-3 sm:py-3.5 rounded-2xl shadow-lg
                      transition-all duration-200 text-left flex flex-col justify-between
                      min-h-[100px] sm:min-h-[110px]
                      ${cardClasses}
                      ${
                        isOccupied
                          ? "cursor-not-allowed opacity-75 pointer-events-none"
                          : "hover:shadow-xl hover:-translate-y-0.5 hover:brightness-110"
                      }
                    `}
                  >
                    {/* small status dot (top-right) */}
                    <span
                      className={`
                        absolute top-2 right-2 w-2 h-2 rounded-full 
                        ${statusDot} shadow-[0_0_6px_rgba(34,197,94,0.8)]
                      `}
                    />

                    {/* top row: label + table number */}
                    <div className="flex items-start justify-between mb-2 pr-3">
                      <div>
                        <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400">
                          Table
                        </div>
                        <div className="text-sm font-bold text-white leading-snug">
                          {table.number}
                        </div>
                      </div>
                    </div>

                    {/* middle: icon */}
                    <div className="flex flex-col items-center gap-1.5 mb-1">
                      <div className="p-1.5 rounded-2xl bg-black/20 flex items-center justify-center">
                        {getTableIcon(table.seats || 4, isOccupied)}
                      </div>
                    </div>

                    {/* bottom: seats / status */}
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-semibold tracking-[0.22em] uppercase text-white/85">
                      <span>
                        {table.seats ? `${table.seats} Seats` : "4 Seats"}
                      </span>
                      {isOccupied ? (
                        <span className="text-red-300">Reserved</span>
                      ) : isSelected ? (
                        <span className="text-orange-300">Selected</span>
                      ) : (
                        <span className="text-green-300">Available</span>
                      )}
                    </div>

                    {/* selected check icon (top-left) */}
                    {isSelected && !isOccupied && (
                      <div className="absolute -top-1.5 -left-1.5 rounded-full bg-white shadow-md p-0.5">
                        <CheckCircle2
                          size={16}
                          className="text-blue-500 fill-blue-500"
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-[#020617]/95 backdrop-blur-xl border-t border-white/10 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* legend + count */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-400" /> Available
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-orange-400" /> Selected
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500" /> Occupied
              </span>
            </div>

            <div className="text-white font-medium">
              {selectedCount > 0 ? (
                <span className="text-orange-400 font-semibold text-base sm:text-lg">
                  {selectedCount} Table Selected
                </span>
              ) : (
                <span className="text-slate-300 text-sm">
                  Select a table to continue
                </span>
              )}
            </div>
          </div>

          {/* confirm button */}
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className={`mt-1 sm:mt-0 flex items-center justify-center gap-2 px-7 sm:px-9 py-3 sm:py-3.5 rounded-xl font-bold text-base sm:text-lg transition-all duration-200 shadow-lg
              ${
                selectedCount > 0
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-orange-500/40 hover:-translate-y-[2px]"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }
            `}
          >
            Confirm Selection
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableSelector;
