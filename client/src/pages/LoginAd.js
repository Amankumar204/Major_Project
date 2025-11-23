import React, { useState, useContext } from "react";
import API from "../api";
import { AuthContext } from "../context/AuthContext";
import "../styles/Login.css";
import { useNavigate, Link } from "react-router-dom";

export default function LoginAd() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  async function login(e) {
    e.preventDefault();
    try {
      // 🔑 Use email instead of phone
      const res = await API.post("/admin/login", { email, password });

      // store token & role
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", "admin");

      // store admin details
      setUser(res.data.admin);

      // navigate to admin dashboard
      navigate("/admin-dashboard");
    } catch (err) {
      console.error("Admin login error:", err);
      alert(err?.response?.data?.message || "Invalid admin credentials");
    }
  }

  return (
    <div id="background">
      <div id="container">
        <h2>Admin Login</h2>
        <p>Manage and monitor your restaurant system.</p>

        <form onSubmit={login}>
          {/* EMAIL FIELD */}
          <label htmlFor="email">Email</label>
          <div className="input-group">
            <input
              type="email"
              id="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <span className="icon">📧</span>
          </div>

          {/* PASSWORD FIELD */}
          <label htmlFor="password">Password</label>
          <div className="input-group">
            <input
              type="password"
              id="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="icon">🔒</span>
          </div>

          <div className="remember">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember me</label>
          </div>

          <button id="loginbtn" type="submit">
            Login as Admin
          </button>

          <div className="signup">
            Staff? <Link to="/login-cw">Login here</Link> • User?{" "}
            <Link to="/login">Login here</Link>
            <br />
            <span style={{ fontSize: "0.9rem", color: "#777" }}>
              Admins can also <Link to="/signup-admin">create a new admin</Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
