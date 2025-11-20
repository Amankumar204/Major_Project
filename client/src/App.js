import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Tables from './pages/TableMap';
import AIAssistantPage from './pages/AIAssistantPage';
import SignUp from './pages/SignUp';
import AfterOrder from "./pages/AfterOrder";
import TableSelector from './pages/TableSelector';
import LoginAd from './pages/LoginAd';
import LoginCW from './pages/LoginCW';
import Assistant from './pages/Assistant';
import SignUpAdmin from "./pages/SignUpAdmin";
import CookDashboard from "./pages/CookDashboard";
import SignUpStaff from "./pages/SignUpStaff";
import WaiterDashboard from "./pages/WaiterDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Bill from "./pages/Bill";
import ThankYou from "./pages/Thankyou";
function App() {
  return (
    <Router>
     

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login-admin" element={<LoginAd />} />
        <Route path="/login-cw" element={<LoginCW />} />
        <Route path="/signup-admin" element={<SignUpAdmin />} />
        <Route path="/signup-staff" element={<SignUpStaff />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/cook-dashboard" element={<CookDashboard />} />
        <Route path="/TableSelector" element={<TableSelector/>} />
        <Route path="/signup" element={<SignUp/>} />
        <Route path="/after-order" element={<AfterOrder/>} />
	<Route path="/ai-assistant" element={<AIAssistantPage />} />
	<Route path="/tables" element={<Tables />} />
  <Route path="/waiter-dashboard" element={<WaiterDashboard />} />
        <Route path="/" element={<h2>Home Page</h2>} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/bill" element={<Bill />} />
        <Route path="/thank-you" element={<ThankYou />} />
      </Routes>
    </Router>
  );
}

export default App;
