// src/pages/SmartDineAdminLogin.jsx

import React, { useState, useContext } from "react";
import {
  Utensils,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Shield,
} from "lucide-react";

import API from "../api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function SmartDineAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- UI state ---
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Login Failed");
  const [modalMessage, setModalMessage] = useState("");

  const hideModal = () => setModalOpen(false);

  // 🔐 ADMIN LOGIN LOGIC
  async function login(e) {
    e.preventDefault();
    setIsLoading(true);
    setIsSuccess(false);

    try {
      // 🔑 Admin-specific API endpoint
      const res = await API.post("/admin/login", { email, password });

      // store token & role
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", "admin");
      setUser(res.data.admin);

      setIsSuccess(true);
      setModalOpen(false);

      // navigate to admin dashboard
      navigate("/admin-dashboard");
    } catch (err) {
      console.error("Admin login error:", err);
      setIsSuccess(false);
      setModalTitle("Auth Failed");
      setModalMessage(
        err?.response?.data?.message || "Invalid admin credentials"
      );
      setModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen overflow-hidden font-sans antialiased text-white relative bg-[#0f172a]">
      
      {/* 1. BACKGROUND IMAGE & DARK OVERLAY */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
          className="w-full h-full object-cover"
          alt="Restaurant Ambience"
        />
        {/* Dark, subtle gradient overlay for premium look */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-black/90"></div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="flex items-center justify-center w-full h-screen relative z-10 p-4 animate-fade-in">
        <div className="relative w-full max-w-[450px]">
          
          {/* LOGIN CARD - Dark Glassmorphism */}
          <div className="bg-[#111827]/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-10 ring-1 ring-white/5 relative overflow-hidden">
            
            {/* Top Orange Line Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600" />

            {/* HEADER SECTION */}
            <div className="text-center mb-10 mt-2">
              <div className="mx-auto w-fit mb-6 flex items-center gap-3 justify-center">
                <div className="relative flex items-center justify-center w-12 h-12">
                  <div className="w-10 h-10 bg-red-600 rotate-45 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/40">
                     <Shield className="w-6 h-6 text-white -rotate-45 stroke-[2.5]" />
                  </div>
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-black tracking-tight text-white leading-none">
                    SmartDine
                  </h1>
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-red-400 mt-1">
                    Administrator Access
                  </p>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-100">Admin Portal Login</h2>
              <p className="text-gray-400 mt-2 text-sm">
                Manage and monitor your restaurant system.
              </p>
            </div>

            {/* FORM */}
            <form className="space-y-5" onSubmit={login}>
              
              {/* Email Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-gray-400 ml-1 tracking-wider" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    id="email"
                    placeholder="admin@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-white placeholder-gray-600 outline-none font-medium"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-gray-400 ml-1 tracking-wider" htmlFor="password">
                  Password
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    id="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-white placeholder-gray-600 outline-none font-medium"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-red-500 bg-gray-800 border-gray-600 rounded focus:ring-red-500 cursor-pointer transition-colors"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                    Remember me
                  </span>
                </label>

                <button
                  type="button"
                  className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-500/20 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] ${
                  isSuccess
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-red-600 hover:bg-red-500"
                } ${isLoading ? "opacity-80 cursor-wait" : ""}`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isSuccess ? (
                  "Success!"
                ) : (
                  <>
                    Login as Admin <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Footer Links */}
              <div className="text-xs text-gray-500 text-center mt-6 pt-4 border-t border-gray-800/50">
                Staff?{" "}
                <Link
                  to="/login-cw"
                  className="text-gray-300 hover:text-red-400 font-semibold transition-colors"
                >
                  Login here
                </Link>{" "}
                • User?{" "}
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-red-400 font-semibold transition-colors"
                >
                  Login here
                </Link>
                <br />
                <span className="text-xs text-gray-500 block mt-2">
                  Admins can also{" "}
                  <Link
                    to="/signup-admin"
                    className="text-red-400 hover:text-red-300 font-semibold transition-colors"
                  >
                    create a new admin
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ALERT MODAL (Same as Login) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111827] border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm animate-bounce-small text-center">
            <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {modalTitle}
            </h3>
            <p className="text-gray-400 mb-6 text-sm">
              {modalMessage}
            </p>
            <button
              onClick={hideModal}
              className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}