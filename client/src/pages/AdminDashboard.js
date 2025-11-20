import React, { useState, useEffect } from "react";
import API from "../api";
import AdminSidebar from "../components/AdminSidebar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "../styles/AdminDashboard.css";

export default function AdminDashboard() {
  const [activePanel, setActivePanel] = useState("overview");

  // ── Add Staff (unified) ────────────────────────────────────────────────
  const [staffForm, setStaffForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    password: "",
  });
  const [savingStaff, setSavingStaff] = useState(false);

  // ── Add Dish ───────────────────────────────────────────────────────────
  const [menuItem, setMenuItem] = useState({ name: "", category: "", price: "" });
  const [savingDish, setSavingDish] = useState(false);

  // ── Data Panels ────────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [salesData, setSalesData] = useState([]);

  // ── Manage Staff state ─────────────────────────────────────────────────
  const [staffTab, setStaffTab] = useState("waiter"); // waiter | cook
  const [waiters, setWaiters] = useState([]);
  const [cooks, setCooks] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [payModal, setPayModal] = useState({ open: false, staff: null });
  const [payForm, setPayForm] = useState({ amount: "", month: "", method: "Cash", note: "" });
  const [paySubmitting, setPaySubmitting] = useState(false);

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
      const res = await API.get("/orders/sales");
      setSalesData(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Manage Staff: fetch staff lists (from separate collections) ────────
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

  // Helper: keep only digits in phone
  const normalizePhone = (p) => String(p || "").replace(/\D/g, "");

  // ── Submit: Add Staff (still uses your existing signup route) ──────────
  const handleAddStaff = async (e) => {
    e.preventDefault();

    const roleRaw = (staffForm.role || "").toLowerCase().trim();
    const role = roleRaw === "chef" ? "cook" : roleRaw;

    const payload = {
      name: staffForm.name.trim(),
      phone: normalizePhone(staffForm.phone),
      email: staffForm.email.trim() || undefined,
      role,                // waiter | cook (chef → cook)
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
    // send exactly what backend expects
    const payload = {
      name: menuItem.name.trim(),
      category: menuItem.category, // already normalized by select
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

//decision request
  const decideRequest = async (id, decision) => {
  try {
    await API.post(`/requests/${id}/decision`, { decision });
    setRequests(prev => prev.filter(r => r._id !== id)); // remove from list
  } catch (e) {
    console.error(e);
    alert("Failed to update request");
  }
};

  // ── Requests Approve ───────────────────────────────────────────────────
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

  // ── Remove Staff (hit collection-specific endpoints) ───────────────────
  const removeStaff = async (id) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;
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

  // ── Pay Salary (unchanged; uses your payroll endpoint) ─────────────────
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
        month: payForm.month, // e.g. "2025-11"
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

  // ── Send Coupon ────────────────────────────────────────────────────────
  const sendCoupon = async (email, score) => {
    try {
      await API.post("/ai/send-coupon", { email, score });
      alert(`Coupon sent to ${email}`);
    } catch (err) {
      alert("Failed to send coupon");
    }
  };

  // ── Filtered staff list by search ──────────────────────────────────────
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
            <div className="ms-avatar">{(s.name || "S").charAt(0).toUpperCase()}</div>
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
                {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>

          <div className="ms-card__actions">
            <button className="ms-btn ms-btn--success" onClick={() => openPayModal(s)}>
              💸 Pay Salary
            </button>
            <button className="ms-btn ms-btn--danger" onClick={() => removeStaff(s._id)}>
              🗑️ Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

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

      {/* Pay Modal (unchanged logic; just class names for consistency) */}
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
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                />
              </label>
              <label className="ms-field">
                <span>Month</span>
                <input
                  type="month"
                  value={payForm.month}
                  onChange={(e) => setPayForm({ ...payForm, month: e.target.value })}
                />
              </label>
              <label className="ms-field">
                <span>Method</span>
                <select
                  value={payForm.method}
                  onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
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
                  onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                />
              </label>

              <div className="ms-modal__actions">
                <button
                  type="button"
                  className="ms-btn ms-btn--ghost"
                  onClick={() => setPayModal({ open: false, staff: null })}
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
      <div className="add-staff-card">
        <h2 className="add-staff-title">👥 Add New Staff Member</h2>
        <p className="add-staff-sub">
          Register Waiters, Cooks, or Chefs and provide login details below.
        </p>

        <form onSubmit={handleAddStaff} className="add-staff-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="e.g. Raghu"
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={staffForm.phone}
              onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Email (optional)</label>
            <input
              type="email"
              placeholder="e.g. staff@smartdine.com"
              value={staffForm.email}
              onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select
              value={staffForm.role}
              onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
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
              onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
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
      <div className="add-dish-card">
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
              onChange={(e) => setMenuItem({ ...menuItem, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={menuItem.category}
              onChange={(e) => setMenuItem({ ...menuItem, category: e.target.value })}
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
              onChange={(e) => setMenuItem({ ...menuItem, price: e.target.value })}
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
          <p className="rq-sub">Review pending requests from staff and take action.</p>
        </div>
        <div className="rq-actions-right">
          {/* (optional) Quick filter – wire up later if you add filtering */}
          {/* <select className="rq-filter">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select> */}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="rq-empty">
          <div className="rq-empty-emoji">🎉</div>
          <div className="rq-empty-title">No pending requests</div>
          <div className="rq-empty-sub">You’re all caught up for now.</div>
        </div>
      ) : (
        <div className="rq-grid">
          {requests.map((r) => {
            const status = String(r.status || "pending").toLowerCase();
            return (
              <div key={r._id} className="rq-card">
                {/* Header */}
                <div className="rq-card-head">
                  <span className={`rq-chip ${status}`}>{status}</span>
                  <span className="rq-time">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                  </span>
                </div>

                {/* Title */}
                <div className="rq-name">
                  {r.name || "(no name)"}{" "}
                  {r.price != null && <span className="rq-price">₹{r.price}</span>}
                </div>

                {/* Meta rows */}
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
                    <span className="rq-value">{r.requestedBy || "—"}</span>
                  </div>
                  {r.notes && (
                    <div className="rq-notes">
                      <span className="rq-notes-label">Notes</span>
                      <p>{r.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="rq-card-actions">
                  {status === "pending" ? (
                    <>
                      <button
                        className="rq-btn rq-btn--approve"
                        onClick={() => decideRequest(r._id, "approved")}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="rq-btn rq-btn--reject"
                        onClick={() => decideRequest(r._id, "rejected")}
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
          <Card className="animate-fadeIn">
            <CardContent className="p-6">
              <h2 className="font-bold mb-4 text-indigo-700 text-lg">📊 Sales Analytics</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      case "users":
        return (
          <div className="grid gap-4 animate-fadeIn">
            {users.map((u) => (
              <Card key={u._id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-indigo-700">{u.name}</h3>
                    <p>{u.email}</p>
                    <p className="text-sm text-gray-600">Score: {u.score}</p>
                  </div>
                  <Button onClick={() => sendCoupon(u.email, u.score)}>🎁 Send Coupon</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        );

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
