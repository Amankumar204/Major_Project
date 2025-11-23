import React, { useState, useContext } from 'react';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import '../styles/Login.css';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginCW() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  async function login(e) {
    e.preventDefault();
    try {
      // 🔑 send email instead of phone
      const res = await API.post('/auth/staff-login', { email, password });

      // ✅ Get role from the API response
      const role = res.data.user?.role || 'staff';

      // store in localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', role);
      setUser(res.data.user);

      // ✅ Navigate based on role
      if (role === 'cook') {
        navigate('/cook-dashboard');
      } else if (role === 'waiter') {
        navigate('/waiter-dashboard');
      } else {
        // fallback
        navigate('/TableSelector');
      }

    } catch (err) {
      alert('Invalid staff credentials');
      console.error(err);
    }
  }

  return (
    <div id="background">
      <div id="container">
        <h2>Staff Login</h2>
        <p>Cook / Waiter — access your assigned tables.</p>

        <form onSubmit={login}>
          <label htmlFor="email">Email</label>
          <div className="input-group">
            <input
              type="email"
              id="email"
              placeholder="staff@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <span className="icon">📧</span>
          </div>

          <label htmlFor="password">Password</label>
          <div className="input-group">
            <input
              type="password"
              id="password"
              placeholder="Staff password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <span className="icon">🔒</span>
          </div>

          <div className="remember">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember me</label>
          </div>

          <button id="loginbtn" type="submit">Login as Staff</button>

          <div className="signup">
            User? <Link to="/login">Login here</Link> • Admin? <Link to="/login-admin">Login here</Link><br />
            <span style={{ fontSize: '0.9rem', color: '#777' }}>
              Need access? <Link to="/signup-staff">Request account</Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
