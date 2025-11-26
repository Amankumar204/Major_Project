// src/pages/TableSelector.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Armchair, 
  Users, 
  CheckCircle2, 
  Ban, 
  ArrowRight,
  LayoutGrid
} from "lucide-react";
import API from "../api";

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

  // Helper to calculate stats
  const totalTables = tables.length;
  const occupiedCount = tables.filter(t => t.status === "occupied").length;
  const availableCount = totalTables - occupiedCount;
  const selectedCount = selectedIds.length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white relative font-sans selection:bg-orange-500 selection:text-white">
      
      {/* 1. BACKGROUND (Same as Login) */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
          className="w-full h-full object-cover opacity-20"
          alt="Restaurant Ambience"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/90 via-[#0f172a]/95 to-[#0f172a]" />
      </div>

      {/* 2. MAIN CONTENT CONTAINER */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-screen flex flex-col">
        
        {/* HEADER & STATS */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 animate-fade-in-down">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-orange-600 rounded-xl shadow-lg shadow-orange-600/20">
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">Floor Plan</h1>
            </div>
            <p className="text-gray-400 text-sm font-medium ml-1">
              Select available tables to seat guests
            </p>
          </div>

          {/* Stats Cards */}
          <div className="flex gap-4">
            <div className="bg-gray-800/50 backdrop-blur-md border border-white/5 px-5 py-3 rounded-2xl flex flex-col items-center min-w-[100px]">
              <span className="text-2xl font-bold text-green-400">{availableCount}</span>
              <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">Available</span>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-md border border-white/5 px-5 py-3 rounded-2xl flex flex-col items-center min-w-[100px]">
              <span className="text-2xl font-bold text-red-400">{occupiedCount}</span>
              <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">Occupied</span>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
             <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* TABLE GRID */}
        {!loading && (
          <div className="flex-1 overflow-y-auto pb-32 pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {tables.map((table) => {
                const isSelected = selectedIds.includes(table._id);
                const isOccupied = table.status === "occupied";

                return (
                  <button
                    key={table._id}
                    onClick={() => handleClick(table)}
                    disabled={isOccupied}
                    className={`
                      relative group p-6 rounded-3xl border transition-all duration-300 flex flex-col items-center justify-center gap-4 min-h-[160px]
                      ${isOccupied 
                        ? "bg-red-900/10 border-red-900/20 opacity-60 cursor-not-allowed" 
                        : isSelected 
                          ? "bg-orange-600 border-orange-500 shadow-[0_0_30px_rgba(234,88,12,0.3)] scale-[1.02] z-10" 
                          : "bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/60 hover:border-gray-600 hover:shadow-xl"
                      }
                    `}
                  >
                    {/* Status Dot */}
                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                      isOccupied ? "bg-red-500" : isSelected ? "bg-white animate-pulse" : "bg-green-500"
                    }`} />

                    {/* Icon */}
                    <div className={`
                      p-4 rounded-full transition-colors duration-300
                      ${isOccupied 
                        ? "bg-red-900/20 text-red-700" 
                        : isSelected 
                          ? "bg-white/20 text-white" 
                          : "bg-gray-700/50 text-gray-400 group-hover:text-green-400 group-hover:bg-green-900/20"
                      }
                    `}>
                      {isOccupied ? <Ban size={32} /> : <Armchair size={32} strokeWidth={1.5} />}
                    </div>

                    {/* Text */}
                    <div className="text-center">
                      <span className={`block text-lg font-bold ${isSelected ? "text-white" : "text-gray-200"}`}>
                        Table {table.number}
                      </span>
                      <span className={`text-xs font-medium uppercase tracking-wider mt-1 block ${
                        isOccupied ? "text-red-500" : isSelected ? "text-orange-200" : "text-gray-500"
                      }`}>
                        {isOccupied ? "Reserved" : isSelected ? "Selected" : "4 Seats"}
                      </span>
                    </div>

                    {/* Selected Checkmark Overlay */}
                    {isSelected && (
                      <div className="absolute top-4 left-4 text-white animate-scale-in">
                        <CheckCircle2 size={20} className="fill-white text-orange-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. FLOATING ACTION BAR (Bottom) */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-[#0f172a]/80 backdrop-blur-xl border-t border-white/10 p-4 sm:p-6 transition-transform duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400 mr-4">
                <span className="w-3 h-3 rounded-full bg-green-500"></span> Available
                <span className="w-3 h-3 rounded-full bg-orange-500 ml-2"></span> Selected
                <span className="w-3 h-3 rounded-full bg-red-500 ml-2"></span> Occupied
             </div>
             <div className="text-white font-medium">
               {selectedCount > 0 
                 ? <span className="text-orange-400 font-bold text-lg">{selectedCount} tables selected</span> 
                 : "Select a table to continue"}
             </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className={`
              flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg
              ${selectedCount > 0 
                ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white transform hover:-translate-y-1 shadow-orange-500/25" 
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            Confirm Selection <ArrowRight size={20} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default TableSelector;