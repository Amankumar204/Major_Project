import React, { useState } from "react";
import "../styles/SignUp.css";
import bgImage from "../styles/1.png";

const Signup = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  // update form state
  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  // handle signup button click
  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("Creating account...");

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Account created successfully!");
        setForm({ name: "", phone: "", email: "", password: "" });
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Server error, please try again later.");
    }
  };

  return (
    <div id="background" style={{ backgroundImage: `url(${bgImage})` }}>
      <div id="container">
        <h2>Create Account</h2>
        <p>Join Smart Dine as a Waiter</p>

        {/* Name */}
        <label htmlFor="name">Full Name</label>
        <div className="input-group">
          <input
            type="text"
            id="name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
          />
          <span className="icon">👤</span>
        </div>

        {/* Phone */}
        <label htmlFor="phone">Phone Number</label>
        <div className="input-group">
          <input
            type="tel"
            id="phone"
            placeholder="+1 (555) 123-4567"
            value={form.phone}
            onChange={handleChange}
          />
          <span className="icon">📞</span>
        </div>

        {/* Email */}
        <label htmlFor="email">Email Address</label>
        <div className="input-group">
          <input
            type="email"
            id="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
          />
          <span className="icon">📧</span>
        </div>

        {/* Password */}
        <label htmlFor="password">Password</label>
        <div className="input-group">
          <input
            type="password"
            id="password"
            placeholder="Create a strong password"
            value={form.password}
            onChange={handleChange}
          />
          <span className="icon">🔒</span>
        </div>

        <button id="signupbtn" onClick={handleSignup}>
          Sign Up
        </button>

        {message && <p className="msg">{message}</p>}

        <div className="signup">
          Already have an account? <a href="#">Login</a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
