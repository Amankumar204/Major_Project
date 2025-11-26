import React, { useState, useEffect } from "react";
import API from "../api";
import AdminSidebar from "../components/AdminSidebar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import UsersCoupons from "../components/UsersCoupons";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";


export default function AdminDashboard() {
  const [activePanel, setActivePanel] = useState("overview");

  // ── Add Staff ──────────────────────────────────────────────────────────
  const [staffForm, setStaffForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    password: "",
  });
  const [savingStaff, setSavingStaff] = useState(false);

  // ── Add Dish ───────────────────────────────────────────────────────────
  const [menuItem, setMenuItem] = useState({
    name: "",
    category: "",
    price: "",
  });
  const [savingDish, setSavingDish] = useState(false);

  // ── Data Panels ────────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);

  // sales
  const [salesData, setSalesData] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState("");
  const [salesRange, setSalesRange] = useState("weekly"); // weekly | monthly | yearly

  // ── Manage Staff ───────────────────────────────────────────────────────
  const [staffTab, setStaffTab] = useState("waiter");
  const [waiters, setWaiters] = useState([]);
  const [cooks, setCooks] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [payModal, setPayModal] = useState({ open: false, staff: null });
  const [payForm, setPayForm] = useState({
    amount: "",
    month: "",
    method: "Cash",
    note: "",
  });
  const [paySubmitting, setPaySubmitting] = useState(false);

  // ── Initial data fetch ─────────────────────────────────────────────────
  useEffect(() => {
    fetchRequests();
    fetchUsers();
    fetchSales();
  }, []);

  useEffect(() => {
    if (activePanel === "manage-staff") {
      fetchStaffLists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePanel]);

  // ── API calls ─────────────────────────────────────────────────────────
  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests");
      setRequests(res.data);
    } catch (err) {
      console.error("Failed fetching requests", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get("/auth/all-users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSales = async () => {
    try {
      setSalesLoading(true);
      setSalesError("");
      const res = await API.get("/orders/sales");
      const data = Array.isArray(res.data) ? res.data : res.data?.orders || [];
      setSalesData(data);
    } catch (err) {
      console.error("Failed to fetch sales", err);
      setSalesError("Failed to load sales data.");
    } finally {
      setSalesLoading(false);
    }
  };

  const fetchStaffLists = async () => {
    try {
      setStaffLoading(true);
      const [w, c] = await Promise.all([
        API.get("/auth/waiters"),
        API.get("/auth/cooks"),
      ]);
      setWaiters(Array.isArray(w.data) ? w.data : w.data?.staff || []);
      setCooks(Array.isArray(c.data) ? c.data : c.data?.staff || []);
    } catch (err) {
      console.error("Failed to load staff lists", err);
    } finally {
      setStaffLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────
  const normalizePhone = (p) => String(p || "").replace(/\D/g, "");

  // ── Submit: Add Staff ─────────────────────────────────────────────────
  const handleAddStaff = async (e) => {
    e.preventDefault();

    const roleRaw = (staffForm.role || "").toLowerCase().trim();
    const role = roleRaw === "chef" ? "cook" : roleRaw;

    const payload = {
      name: staffForm.name.trim(),
      phone: normalizePhone(staffForm.phone),
      email: staffForm.email.trim() || undefined,
      role,
      password: staffForm.password,
    };

    if (!payload.name || !payload.phone || !payload.role || !payload.password) {
      return alert("Please fill all required fields: Name, Phone, Role, Password.");
    }

    setSavingStaff(true);
    try {
      await API.post("/auth/staff-signup", payload);
      alert(`${payload.role} added successfully ✅`);
      setStaffForm({ name: "", phone: "", email: "", role: "", password: "" });
      if (activePanel === "manage-staff") fetchStaffLists();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to add staff");
    } finally {
      setSavingStaff(false);
    }
  };

  // ── Submit: Add Dish ───────────────────────────────────────────────────
  const handleAddDish = async (e) => {
    e.preventDefault();
    if (!menuItem.name || !menuItem.category || !menuItem.price) {
      return alert("Please fill all fields for the dish.");
    }

    setSavingDish(true);
    try {
      const payload = {
        name: menuItem.name.trim(),
        category: menuItem.category,
        price: Number(menuItem.price),
      };
      await API.post("/menu/items", payload);
      alert("✅ Dish added successfully!");
      setMenuItem({ name: "", category: "", price: "" });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to add dish");
    } finally {
      setSavingDish(false);
    }
  };

  // ── Requests ───────────────────────────────────────────────────────────
  const decideRequest = async (id, decision) => {
    try {
      await API.post(`/requests/${id}/decision`, { decision });
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to update request");
    }
  };

  const handleApproveRequest = async (reqId) => {
    try {
      await API.patch(`/requests/${reqId}`, { status: "approved" });
      setRequests((prev) =>
        prev.map((r) => (r._id === reqId ? { ...r, status: "approved" } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ── Staff actions ──────────────────────────────────────────────────────
  const removeStaff = async (id) => {
    if (!window.confirm("Are you sure you want to remove this staff member?"))
      return;
    try {
      if (staffTab === "waiter") {
        await API.delete(`/auth/waiters/${id}`);
      } else {
        await API.delete(`/auth/cooks/${id}`);
      }
      alert("Staff removed");
      fetchStaffLists();
    } catch (err) {
      console.error(err);
      alert("Failed to remove staff");
    }
  };

  const openPayModal = (staff) => {
    setPayForm({ amount: "", month: "", method: "Cash", note: "" });
    setPayModal({ open: true, staff });
  };
  const closePayModal = () => setPayModal({ open: false, staff: null });

  const submitPay = async (e) => {
    e.preventDefault();
    if (!payForm.amount || !payForm.month) {
      return alert("Please enter amount and month.");
    }
    setPaySubmitting(true);
    try {
      await API.post("/admin-dashboard/payroll/pay", {
        staffId: payModal.staff._id,
        amount: Number(payForm.amount),
        month: payForm.month,
        method: payForm.method,
        note: payForm.note || "",
      });
      alert("Payment recorded ✅");
      closePayModal();
    } catch (err) {
      console.error(err);
      alert("Failed to record payment");
    } finally {
      setPaySubmitting(false);
    }
  };

  // ── Coupons ────────────────────────────────────────────────────────────
  const sendCoupon = async (email, score) => {
    try {
      await API.post("/ai/send-coupon", { email, score });
      alert(`Coupon sent to ${email}`);
    } catch (err) {
      alert("Failed to send coupon");
    }
  };

  // ── Staff list helpers ─────────────────────────────────────────────────
  const filterBySearch = (list) => {
    const q = staffSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
    );
  };

  const renderStaffList = (list, roleLabel) => {
    const filtered = filterBySearch(list);
    if (staffLoading) return <p className="ms-muted">Loading…</p>;
    if (!filtered.length) return <p className="ms-muted">No {roleLabel}s found</p>;

    return (
      <div className="ms-grid">
        {filtered.map((s) => (
          <div key={s._id} className="ms-card">
            <div className="ms-card__header">
              <div className="ms-avatar">
                {(s.name || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="ms-name">{s.name || "—"}</div>
                <div className="ms-role">{roleLabel}</div>
              </div>
            </div>

            <div className="ms-card__body">
              <div className="ms-row">
                <span className="ms-label">Email</span>
                <span className="ms-value">{s.email || "—"}</span>
              </div>
              <div className="ms-row">
                <span className="ms-label">Phone</span>
                <span className="ms-value">{s.phone || "—"}</span>
              </div>
              <div className="ms-row">
                <span className="ms-label">Joined</span>
                <span className="ms-value">
                  {s.createdAt
                    ? new Date(s.createdAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>

            <div className="ms-card__actions">
              <button
                className="ms-btn ms-btn--success"
                onClick={() => openPayModal(s)}
              >
                💸 Pay Salary
              </button>
              <button
                className="ms-btn ms-btn--danger"
                onClick={() => removeStaff(s._id)}
              >
                🗑️ Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─────────────────────────────
  // 🔥 SALES ANALYTICS DERIVED DATA
  // ─────────────────────────────
  const orders = Array.isArray(salesData) ? salesData : [];

  // All-time overview
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, o) => sum + (Number(o.totalCost) || 0),
    0
  );
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

  // Unique & returning customers
  const customerOrderCount = {};
  orders.forEach((o) => {
    const email = (o.userEmail || "").trim().toLowerCase();
    if (!email) return;
    customerOrderCount[email] = (customerOrderCount[email] || 0) + 1;
  });

  const uniqueCustomers = Object.keys(customerOrderCount).length;
  let returningCustomers = 0;
  let firstTimeCustomers = 0;
  Object.values(customerOrderCount).forEach((count) => {
    if (count > 1) returningCustomers += 1;
    else firstTimeCustomers += 1;
  });

  const customerSplitData =
    uniqueCustomers === 0
      ? []
      : [
          { name: "First-time Customers", value: firstTimeCustomers },
          { name: "Returning Customers", value: returningCustomers },
        ];

  const PIE_COLORS = ["#4f46e5", "#22c55e"];

  // Helper: date key
  const getDateKey = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt.toISOString().slice(0, 10);
  };

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // All-time period summaries (for the three small cards)
  let weekRevenue = 0,
    weekOrders = 0;
  let monthRevenue = 0,
    monthOrders = 0;
  let yearRevenue = 0,
    yearOrders = 0;

  orders.forEach((o) => {
    const dt = new Date(o.createdAt);
    if (isNaN(dt.getTime())) return;
    const amount = Number(o.totalCost) || 0;

    if (dt >= sevenDaysAgo) {
      weekRevenue += amount;
      weekOrders += 1;
    }
    if (dt >= startOfMonth) {
      monthRevenue += amount;
      monthOrders += 1;
    }
    if (dt >= startOfYear) {
      yearRevenue += amount;
      yearOrders += 1;
    }
  });

  const weekAOV = weekOrders ? weekRevenue / weekOrders : 0;
  const monthAOV = monthOrders ? monthRevenue / monthOrders : 0;
  const yearAOV = yearOrders ? yearRevenue / yearOrders : 0;

  // ── Selected range data (for dropdown) ─────────────────────────────────
  let rangeStart = sevenDaysAgo;
  if (salesRange === "monthly") rangeStart = startOfMonth;
  if (salesRange === "yearly") rangeStart = startOfYear;

  const rangeLabel =
    salesRange === "weekly"
      ? "Last 7 Days"
      : salesRange === "monthly"
      ? "This Month"
      : "This Year";

  const filteredRangeOrders = orders.filter((o) => {
    const dt = new Date(o.createdAt);
    if (isNaN(dt.getTime())) return false;
    return dt >= rangeStart;
  });

  let rangeRevenue = 0;
  filteredRangeOrders.forEach(
    (o) => (rangeRevenue += Number(o.totalCost) || 0)
  );
  const rangeOrders = filteredRangeOrders.length;
  const rangeAOV = rangeOrders ? rangeRevenue / rangeOrders : 0;

  // Revenue trend for selected range
  const revenueMap = {};
  filteredRangeOrders.forEach((o) => {
    const dt = new Date(o.createdAt);
    if (isNaN(dt.getTime())) return;

    if (salesRange === "yearly") {
      // group by month
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      revenueMap[key] = (revenueMap[key] || 0) + (Number(o.totalCost) || 0);
    } else {
      // group by date
      const key = getDateKey(o.createdAt);
      if (!key) return;
      revenueMap[key] = (revenueMap[key] || 0) + (Number(o.totalCost) || 0);
    }
  });

  const revenueTrendData =
    salesRange === "yearly"
      ? Object.entries(revenueMap)
          .map(([key, revenue]) => {
            const [year, month] = key.split("-").map((n) => parseInt(n, 10));
            const d = new Date(year, month, 1);
            return {
              label: d.toLocaleDateString("en-IN", {
                month: "short",
              }),
              revenue,
            };
          })
          .sort((a, b) => a.label.localeCompare(b.label))
      : Object.entries(revenueMap)
          .map(([date, revenue]) => ({
            label: new Date(date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
            }),
            revenue,
          }))
          .sort((a, b) => (a.label < b.label ? -1 : 1));

  // Revenue by day of week (for selected range)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowMap = {};
  filteredRangeOrders.forEach((o) => {
    const dt = new Date(o.createdAt);
    if (isNaN(dt.getTime())) return;
    const dayIdx = dt.getDay();
    dowMap[dayIdx] = (dowMap[dayIdx] || 0) + (Number(o.totalCost) || 0);
  });
  const revenueByDayOfWeekData = Object.entries(dowMap)
    .map(([idx, revenue]) => ({
      day: dayNames[idx],
      revenue,
    }))
    .sort((a, b) => dayNames.indexOf(a.day) - dayNames.indexOf(b.day));

  // Best-selling items (all time)
  const itemQuantityMap = {};
  orders.forEach((o) => {
    (o.items || []).forEach((it) => {
      let name;
      let qty = 1;

      if (typeof it === "string") {
        name = it;
      } else if (it && typeof it === "object") {
        name = it.name || "Unnamed Item";
        qty = Number(it.quantity) || 1;
      } else {
        name = "Unnamed Item";
      }

      itemQuantityMap[name] = (itemQuantityMap[name] || 0) + qty;
    });
  });

  const topItemsData = Object.entries(itemQuantityMap)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 7);

  // Most used tables
  const tableCountMap = {};
  orders.forEach((o) => {
    const table = o.tableNo || "Unknown";
    tableCountMap[table] = (tableCountMap[table] || 0) + 1;
  });

  const tableUsageData = Object.entries(tableCountMap)
    .map(([table, count]) => ({ table, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Orders by hour
  const hourCountMap = {};
  orders.forEach((o) => {
    const dt = new Date(o.createdAt);
    if (isNaN(dt.getTime())) return;
    const hour = dt.getHours();
    hourCountMap[hour] = (hourCountMap[hour] || 0) + 1;
  });

  const ordersByHourData = Object.entries(hourCountMap)
    .map(([h, count]) => ({
      hourLabel: `${String(h).padStart(2, "0")}:00`,
      count,
    }))
    .sort((a, b) =>
      a.hourLabel < b.hourLabel ? -1 : a.hourLabel > b.hourLabel ? 1 : 0
    );

  // Top customers (selected range)
  const customerRevenueMap = {};
  filteredRangeOrders.forEach((o) => {
    const email = (o.userEmail || "Unknown").toLowerCase();
    if (!email) return;
    customerRevenueMap[email] =
      (customerRevenueMap[email] || 0) + (Number(o.totalCost) || 0);
  });

  const topCustomersData = Object.entries(customerRevenueMap)
    .map(([email, revenue]) => ({ email, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 7);

  // ── Panels ─────────────────────────────────────────────────────────────
  const renderPanel = () => {
    switch (activePanel) {
      case "manage-staff":
        return (
          <div className="animate-fadeIn">
            <div className="ms-toolbar">
              <div className="ms-tabs">
                <button
                  className={`ms-tab ${staffTab === "waiter" ? "active" : ""}`}
                  onClick={() => setStaffTab("waiter")}
                >
                  Waiters
                </button>
                <button
                  className={`ms-tab ${staffTab === "cook" ? "active" : ""}`}
                  onClick={() => setStaffTab("cook")}
                >
                  Cooks / Chefs
                </button>
              </div>
              <input
                placeholder="Search by name, phone, email…"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="ms-search"
              />
            </div>

            {staffTab === "waiter"
              ? renderStaffList(waiters, "waiter")
              : renderStaffList(cooks, "cook")}

            {payModal.open && (
              <div className="ms-modal__backdrop">
                <div className="ms-modal">
                  <div className="ms-modal__header">
                    <div className="ms-modal__title">
                      Pay Salary — {payModal.staff?.name}
                    </div>
                    <div className="ms-modal__subtitle">
                      Phone: {payModal.staff?.phone || "—"}
                    </div>
                  </div>
                  <form onSubmit={submitPay} className="ms-modal__body">
                    <label className="ms-field">
                      <span>Amount (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={payForm.amount}
                        onChange={(e) =>
                          setPayForm({ ...payForm, amount: e.target.value })
                        }
                      />
                    </label>
                    <label className="ms-field">
                      <span>Month</span>
                      <input
                        type="month"
                        value={payForm.month}
                        onChange={(e) =>
                          setPayForm({ ...payForm, month: e.target.value })
                        }
                      />
                    </label>
                    <label className="ms-field">
                      <span>Method</span>
                      <select
                        value={payForm.method}
                        onChange={(e) =>
                          setPayForm({ ...payForm, method: e.target.value })
                        }
                      >
                        <option>Cash</option>
                        <option>UPI</option>
                        <option>Bank Transfer</option>
                        <option>Other</option>
                      </select>
                    </label>
                    <label className="ms-field">
                      <span>Note (optional)</span>
                      <textarea
                        rows={2}
                        value={payForm.note}
                        onChange={(e) =>
                          setPayForm({ ...payForm, note: e.target.value })
                        }
                      />
                    </label>

                    <div className="ms-modal__actions">
                      <button
                        type="button"
                        className="ms-btn ms-btn--ghost"
                        onClick={() =>
                          setPayModal({ open: false, staff: null })
                        }
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={paySubmitting}
                        className="ms-btn ms-btn--primary"
                      >
                        {paySubmitting ? "Saving…" : "Record Payment"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case "add-staff":
        return (
          <div className="add-staff-container animate-fadeIn">
            <div className="add-staff-card analytics-card">
              <h2 className="add-staff-title">👥 Add New Staff Member</h2>
              <p className="add-staff-sub">
                Register Waiters, Cooks, or Chefs and provide login details
                below.
              </p>

              <form onSubmit={handleAddStaff} className="add-staff-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Raghu"
                    value={staffForm.name}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={staffForm.phone}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, phone: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Email (optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. staff@smartdine.com"
                    value={staffForm.email}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, email: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, role: e.target.value })
                    }
                  >
                    <option value="">Select Role</option>
                    <option value="waiter">Waiter</option>
                    <option value="cook">Cook</option>
                    <option value="chef">Chef</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="e.g. Aman@2004"
                    value={staffForm.password}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, password: e.target.value })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingStaff}
                  className={`add-staff-btn ${savingStaff ? "loading" : ""}`}
                >
                  {savingStaff ? "Adding Staff..." : "Add Staff 👨‍🍳"}
                </button>
              </form>
            </div>
          </div>
        );

      case "add-dish":
        return (
          <div className="add-dish-container animate-fadeIn">
            <div className="add-dish-card analytics-card">
              <h2 className="add-dish-title">🍽️ Add New Dish to Menu</h2>
              <p className="add-dish-sub">
                Create new menu items with category and pricing information.
              </p>

              <form onSubmit={handleAddDish} className="add-dish-form">
                <div className="form-group">
                  <label>Dish Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Paneer Butter Masala"
                    value={menuItem.name}
                    onChange={(e) =>
                      setMenuItem({ ...menuItem, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={menuItem.category}
                    onChange={(e) =>
                      setMenuItem({ ...menuItem, category: e.target.value })
                    }
                  >
                    <option value="">Select Category</option>
                    <option value="starters">Starters</option>
                    <option value="maincourse">Main Course</option>
                    <option value="desserts">Desserts</option>
                    <option value="beverages">Beverages</option>
                    <option value="snacks">Snacks</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 199"
                    value={menuItem.price}
                    onChange={(e) =>
                      setMenuItem({ ...menuItem, price: e.target.value })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingDish}
                  className={`add-dish-btn ${savingDish ? "loading" : ""}`}
                >
                  {savingDish ? "Adding Dish..." : "Add Dish 🍛"}
                </button>
              </form>
            </div>
          </div>
        );

      case "requests":
        return (
          <div className="rq-container animate-fadeIn">
            <div className="rq-toolbar">
              <div>
                <h2 className="rq-title">Requests</h2>
                <p className="rq-sub">
                  Review pending requests from staff and take action.
                </p>
              </div>
              <div className="rq-actions-right" />
            </div>

            {requests.length === 0 ? (
              <div className="rq-empty analytics-card">
                <div className="rq-empty-emoji">🎉</div>
                <div className="rq-empty-title">No pending requests</div>
                <div className="rq-empty-sub">
                  You’re all caught up for now.
                </div>
              </div>
            ) : (
              <div className="rq-grid">
                {requests.map((r) => {
                  const status = String(r.status || "pending").toLowerCase();
                  return (
                    <div key={r._id} className="rq-card analytics-card">
                      <div className="rq-card-head">
                        <span className={`rq-chip ${status}`}>{status}</span>
                        <span className="rq-time">
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleString()
                            : "—"}
                        </span>
                      </div>

                      <div className="rq-name">
                        {r.name || "(no name)"}{" "}
                        {r.price != null && (
                          <span className="rq-price">₹{r.price}</span>
                        )}
                      </div>

                      <div className="rq-rows">
                        <div className="rq-row">
                          <span className="rq-label">Type</span>
                          <span className="rq-value">{r.type || "—"}</span>
                        </div>
                        <div className="rq-row">
                          <span className="rq-label">Category</span>
                          <span className="rq-value">{r.category || "—"}</span>
                        </div>
                        <div className="rq-row">
                          <span className="rq-label">Requested By</span>
                          <span className="rq-value">
                            {r.requestedBy || "—"}
                          </span>
                        </div>
                        {r.notes && (
                          <div className="rq-notes">
                            <span className="rq-notes-label">Notes</span>
                            <p>{r.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="rq-card-actions">
                        {status === "pending" ? (
                          <>
                            <button
                              className="rq-btn rq-btn--approve"
                              onClick={() =>
                                decideRequest(r._id, "approved")
                              }
                            >
                              ✅ Approve
                            </button>
                            <button
                              className="rq-btn rq-btn--reject"
                              onClick={() =>
                                decideRequest(r._id, "rejected")
                              }
                            >
                              ❌ Reject
                            </button>
                          </>
                        ) : (
                          <span className={`rq-badge ${status}`}>
                            {status === "approved" ? "Approved" : "Rejected"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "sales":
        return (
          <div className="sales-panel animate-fadeIn">
            {/* Header with dropdown */}
            <div className="sales-header">
              <div>
                <h2 className="sales-title">📊 Sales Analytics</h2>
                <p className="sales-subtitle">
                  Track performance across week, month, and year. You are
                  viewing:{" "}
                  <span className="sales-range-pill">{rangeLabel}</span>
                </p>
              </div>
              <div className="sales-header-controls">
                <label className="sales-range-label">
                  <span>View</span>
                  <select
                    value={salesRange}
                    onChange={(e) => setSalesRange(e.target.value)}
                    className="sales-range-select"
                  >
                    <option value="weekly">Last 7 Days</option>
                    <option value="monthly">This Month</option>
                    <option value="yearly">This Year</option>
                  </select>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSales}
                  className="sd-btn-refresh"
                >
                  🔄 Refresh
                </Button>
              </div>
            </div>

            {salesLoading && (
              <p className="text-gray-600 mb-4">Loading sales data…</p>
            )}
            {salesError && (
              <p className="text-red-600 mb-4 text-sm">{salesError}</p>
            )}

            {!salesLoading && orders.length === 0 && !salesError && (
              <Card className="analytics-card mb-4">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600">
                    No sales data available yet. Once orders are placed, you’ll
                    see detailed analytics here.
                  </p>
                </CardContent>
              </Card>
            )}

            {orders.length > 0 && (
              <>
                {/* All-time overview */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <Card className="analytics-card">
                    <CardContent className="p-4">
                      <div className="sales-metric-label">Total Revenue</div>
                      <div className="sales-metric-value">
                        ₹{totalRevenue.toFixed(0)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="analytics-card">
                    <CardContent className="p-4">
                      <div className="sales-metric-label">Total Orders</div>
                      <div className="sales-metric-value">
                        {totalOrders}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="analytics-card">
                    <CardContent className="p-4">
                      <div className="sales-metric-label">
                        Avg. Order Value
                      </div>
                      <div className="sales-metric-value">
                        ₹{avgOrderValue.toFixed(0)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="analytics-card">
                    <CardContent className="p-4">
                      <div className="sales-metric-label">
                        Unique Customers
                      </div>
                      <div className="sales-metric-value">
                        {uniqueCustomers}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Period summary cards */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                  <Card className="analytics-card">
                    <CardContent className="p-4">
                      <div className="sales-metric-label">Last 7 Days</div>
                      <div className="sales-metric-value">
                        ₹{weekRevenue.toFixed(0)}
                      </div>
                      <div className="sales-metric-sub">
                        {weekOrders} orders • Avg ₹{weekAOV.toFixed(0)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="analytics-card">
                    <CardContent className="p-4">
                      <div className="sales-metric-label">This Month</div>
                      <div className="sales-metric-value text-emerald-700">
                        ₹{monthRevenue.toFixed(0)}
                      </div>
                      <div className="sales-metric-sub">
                        {monthOrders} orders • Avg ₹{monthAOV.toFixed(0)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="analytics-card">
                    <CardContent className="p-4">
                      <div className="sales-metric-label">This Year</div>
                      <div className="sales-metric-value text-amber-700">
                        ₹{yearRevenue.toFixed(0)}
                      </div>
                      <div className="sales-metric-sub">
                        {yearOrders} orders • Avg ₹{yearAOV.toFixed(0)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Selected range KPIs */}
                <Card className="analytics-card mb-8">
                  <CardContent className="p-4 flex flex-wrap gap-6 items-center">
                    <div>
                      <div className="sales-metric-label">
                        Revenue ({rangeLabel})
                      </div>
                      <div className="sales-metric-value">
                        ₹{rangeRevenue.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="sales-metric-label">Orders</div>
                      <div className="sales-metric-value">
                        {rangeOrders}
                      </div>
                    </div>
                    <div>
                      <div className="sales-metric-label">Avg. Order</div>
                      <div className="sales-metric-value">
                        ₹{rangeAOV.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="sales-metric-label">
                        Customers (Selected)
                      </div>
                      <div className="sales-metric-value">
                        {uniqueCustomers}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Row 1: Revenue trend + Top items */}
                <div className="grid gap-6 lg:grid-cols-2 mb-8">
                  <Card className="analytics-card">
                    <CardContent className="p-6">
                      <h3 className="card-title">
                        📈 Revenue — {rangeLabel}
                      </h3>
                      {revenueTrendData.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          No orders in the selected period.
                        </p>
                      ) : (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={revenueTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="revenue" fill="#4f46e5" radius={6} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="analytics-card">
                    <CardContent className="p-6">
                      <h3 className="card-title">🍛 Best Selling Items</h3>
                      {topItemsData.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          No item-level data available.
                        </p>
                      ) : (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={topItemsData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={140}
                            />
                            <Tooltip />
                            <Bar
                              dataKey="quantity"
                              fill="#22c55e"
                              radius={6}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Row 2: Tables + Orders by hour */}
                <div className="grid gap-6 lg:grid-cols-2 mb-8">
                  <Card className="analytics-card">
                    <CardContent className="p-6">
                      <h3 className="card-title">🍽️ Most Used Tables</h3>
                      {tableUsageData.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          No table usage data available.
                        </p>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={tableUsageData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="table" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#f97316" radius={6} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="analytics-card">
                    <CardContent className="p-6">
                      <h3 className="card-title">⏰ Orders by Hour of Day</h3>
                      {ordersByHourData.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          No timestamp data available.
                        </p>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={ordersByHourData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hourLabel" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#0ea5e9" radius={6} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Row 3: Customer split + Revenue by day of week */}
                <div className="grid gap-6 lg:grid-cols-2 mb-8">
                  <Card className="analytics-card">
                    <CardContent className="p-6">
                      <h3 className="card-title">👥 Customer Split</h3>
                      {customerSplitData.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          Not enough customer data yet.
                        </p>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={customerSplitData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                              label
                            >
                              {customerSplitData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="analytics-card">
                    <CardContent className="p-6">
                      <h3 className="card-title">📅 Revenue by Day of Week</h3>
                      {revenueByDayOfWeekData.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          No data in selected period.
                        </p>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={revenueByDayOfWeekData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="revenue" fill="#6366f1" radius={6} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Row 4: Top customers */}
                <Card className="analytics-card mb-10">
                  <CardContent className="p-6">
                    <h3 className="card-title">🏆 Top Customers (by Revenue)</h3>
                    {topCustomersData.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        No customer revenue data yet.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={topCustomersData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis
                            type="category"
                            dataKey="email"
                            width={180}
                          />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="#10b981" radius={6} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        );

      case "users":
        return <UsersCoupons />;
        

      default:
        return (
          <div className="text-center mt-10 animate-fadeIn">
            <h2 className="text-2xl font-bold text-indigo-700">
              Welcome to SmartDine Admin Dashboard 🎯
            </h2>
            <p className="text-gray-600 mt-2">
              Manage staff, menu, customer requests, and view analytics.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="admin-layout flex">
      <AdminSidebar active={activePanel} setActive={setActivePanel} />
      <div className="admin-content flex-1 p-6 overflow-y-auto bg-gray-50 min-h-screen">
        {renderPanel()}
      </div>
    </div>
  );
}
