import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sb-logo">⚡ FUTURE</div>
      
      <div className="nav-section">Main</div>
      <NavLink to="/dashboard" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} end>
        <span className="nav-icon">📊</span>Dashboard
      </NavLink>
      <NavLink to="/markets" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🔥</span>Markets
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">👤</span>Profile & Wallet
      </NavLink>
      
      <div className="nav-section">Social</div>
      <NavLink to="/leaderboard" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🏆</span>Leaderboard
      </NavLink>
      <NavLink to="/squads" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🛡️</span>Squads
      </NavLink>
      <NavLink to="/crypto" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">💎</span>Crypto <span className="live-tag">LIVE</span>
      </NavLink>
      
      <div className="nav-section">Security & Admin</div>
      <NavLink to="/fraud" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🛡️</span>Fraud Shield <span className="live-tag">AI</span>
      </NavLink>
      {isAdmin && (
        <>
          <NavLink to="/admin" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">⚙️</span>Admin Panel
          </NavLink>
        </>
      )}

      <div className="sb-bottom">
        <div className="sb-user">
          <div className="sb-uname">{user?.name || 'User'}</div>
          <div className="sb-ubal">🪙 <span id="sb-bal">{Number(user?.walletBalance || 0).toLocaleString()}</span> coins</div>
          <div className="sb-badge">{isAdmin ? 'ADMIN' : 'TRADER'}</div>
        </div>
        <button className="nav-btn nav-logout" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
