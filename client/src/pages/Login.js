import React, { useState, useContext } from 'react';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import '../styles/Login.css';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  async function login(e) {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', { phone, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', 'user');
      setUser(res.data.user);
      navigate('/TableSelector'); 
    } catch (err) {
      alert('Invalid user credentials');
      console.error(err);
    }
  }

  return (
    <div id="background">
      <div id="container">
        <h2>User Login</h2>
        <p>Welcome back! Please log in to continue.</p>

        <form onSubmit={login}>
          <label htmlFor="phone">Phone Number</label>
          <div className="input-group">
            <input
              type="tel"
              id="phone"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <span className="icon">📞</span>
          </div>

          <label htmlFor="password">Password</label>
          <div className="input-group">
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <span className="icon">🔒</span>
          </div>

          <div className="remember">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember me</label>
          </div>

          <button id="loginbtn" type="submit">Login</button>

          <div className="signup">
            New user? <Link to="/signup">Sign up here</Link><br />
            Admin? <Link to="/login-admin">Login here</Link> • Staff? <Link to="/login-cw">Login here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
