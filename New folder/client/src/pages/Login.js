import React, { useState, useContext } from 'react';
import API from '../api';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useContext(AuthContext);

  async function login(e) {
    e.preventDefault();
    const res = await API.post('/auth/login', { phone, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    window.location.href = '/';
  }

  return (
    <form onSubmit={login} style={{maxWidth:420, margin:'2rem auto'}}>
      <h2>Login</h2>
      <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone" />
      <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" />
      <button type="submit">Login</button>
    </form>
  );
}
