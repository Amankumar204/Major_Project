import React from "react";
import { Home, UserPlus, Users, Utensils, ClipboardList, BarChart2 } from "lucide-react";

export default function AdminSidebar({ active, setActive }) {
  const items = [
    { key: "overview", label: "Overview", icon: <Home size={18} /> },
    { key: "add-staff", label: "Add Staff", icon: <UserPlus size={18} /> },
    { key: "manage-staff", label: "Manage Staff", icon: <Users size={18} /> }, // ✅ NEW
    { key: "add-dish", label: "Add Dish", icon: <Utensils size={18} /> },
    { key: "requests", label: "Requests", icon: <ClipboardList size={18} /> },
    { key: "sales", label: "Sales Analytics", icon: <BarChart2 size={18} /> },
    { key: "users", label: "Users & Coupons", icon: <Users size={18} /> },
  ];

  return (
    <aside className="admin-sidebar">
      <h2 className="sidebar-title">SmartDine Admin</h2>
      <nav className="sidebar-nav">
        {items.map((i) => (
          <button
            key={i.key}
            className={`sidebar-btn ${active === i.key ? "active" : ""}`}
            onClick={() => setActive(i.key)}
          >
            {i.icon}
            <span>{i.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
