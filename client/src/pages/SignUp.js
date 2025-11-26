// src/pages/SmartDineSignup.jsx

import React, { useState } from "react";
import {
  Utensils,
  Mail,
  Lock,
  ArrowRight,
  User,
  Phone,
  AlertCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api"; // Assuming your API file is configured

const SmartDineSignup = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const hideModal = () => setModalOpen(false);

  // Update form state
  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  // ✍️ SIGNUP LOGIC
  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSuccess(false);
    setModalOpen(false); // Clear previous modal

    try {
      // NOTE: You used "http://localhost:5000/signup" in your original code. 
      // I am replacing this with a generic API call structure for React context consistency.
      const response = await API.post("/auth/signup/waiter", {
        // Assuming your backend expects these fields
        fullName: form.name,
        phoneNumber: form.phone,
        email: form.email,
        password: form.password,
        role: 'waiter' // Assuming this signup is specifically for a Waiter role
      });

      if (response.status === 201 || response.status === 200) {
        setIsSuccess(true);
        setModalTitle("Account Created! 🎉");
        setModalMessage("Your SmartDine waiter account was created successfully. You can now log in.");
        setModalOpen(true);
        // Clear form after successful submission
        setForm({ name: "", phone: "", email: "", password: "" });
        // Optional: Redirect to login after a delay
        setTimeout(() => navigate("/login"), 2000); 

      } else {
        // Handle specific server-side errors
        setIsSuccess(false);
        setModalTitle("Registration Failed");
        setModalMessage(response.data.message || "An unknown error occurred during registration.");
        setModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      setModalTitle("Server Error ⚠️");
      setModalMessage("Could not connect to the server. Please check your network or try again.");
      setModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen overflow-hidden font-sans antialiased text-white relative bg-[#0f172a]">
      
      {/* 1. BACKGROUND IMAGE & DARK OVERLAY (Same as Login) */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
          className="w-full h-full object-cover" 
          alt="Restaurant Ambience" 
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-black/90"></div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="flex items-center justify-center w-full h-screen relative z-10 p-4 animate-fade-in">
        <div className="relative w-full max-w-[450px]">
          
          {/* SIGNUP CARD - Dark Glassmorphism */}
          <div className="bg-[#111827]/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-10 ring-1 ring-white/5 relative overflow-hidden">
            
            {/* Top Orange Line Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400" />

            {/* HEADER SECTION */}
            <div className="text-center mb-10 mt-2">
              <div className="mx-auto w-fit mb-6 flex items-center gap-3 justify-center">
                <div className="relative flex items-center justify-center w-12 h-12">
                  <div className="w-10 h-10 bg-orange-500 rotate-45 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/40">
                     <Utensils className="w-6 h-6 text-white -rotate-45 stroke-[2.5]" />
                  </div>
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-black tracking-tight text-white leading-none">
                    SmartDine
                  </h1>
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-orange-400 mt-1">
                    New Account
                  </p>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-100">Create Your Account</h2>
              <p className="text-gray-400 mt-2 text-sm">
                Secure your experience by creating your login.
              </p>
            </div>

            {/* FORM */}
            <form className="space-y-4" onSubmit={handleSignup}>
              
              {/* Name Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-gray-400 ml-1 tracking-wider" htmlFor="name">
                  Full Name
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    id="name"
                    placeholder="John Doe"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-white placeholder-gray-600 outline-none font-medium"
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                </div>
              </div>

              {/* Phone Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-gray-400 ml-1 tracking-wider" htmlFor="phone">
                  Phone Number
                </label>
                <div className="relative group">
                  <input
                    type="tel"
                    id="phone"
                    placeholder="+1 (555) 123-4567"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-white placeholder-gray-600 outline-none font-medium"
                  />
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-gray-400 ml-1 tracking-wider" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-white placeholder-gray-600 outline-none font-medium"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
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
                    placeholder="Create a strong password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-white placeholder-gray-600 outline-none font-medium"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 mt-6 text-white font-bold text-lg rounded-xl shadow-lg shadow-orange-500/20 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] ${
                  isSuccess
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-orange-600 hover:bg-orange-500"
                } ${isLoading ? "opacity-80 cursor-wait" : ""}`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isSuccess ? (
                  "Registered!"
                ) : (
                  <>
                    Sign Up <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Login Link */}
          <div className="text-center mt-8">
            <p className="text-gray-400 text-sm font-medium">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-orange-400 hover:text-orange-300 font-bold hover:underline ml-1"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ALERT MODAL (Same as Login) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`p-8 rounded-2xl shadow-2xl w-full max-w-sm animate-bounce-small text-center ${isSuccess ? 'bg-green-900/40 border-green-800' : 'bg-[#111827] border-gray-800'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${isSuccess ? 'bg-green-800/30' : 'bg-red-900/30'}`}>
              <AlertCircle className={`w-6 h-6 ${isSuccess ? 'text-green-500' : 'text-red-500'}`} />
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
};

export default SmartDineSignup;