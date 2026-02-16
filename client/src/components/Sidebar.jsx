import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ items, role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>🎓 Timetable System</h2>
        <span className="role-badge">{role}</span>
      </div>
      <nav className="sidebar-nav">
        {items.map((section, si) => (
          <div className="nav-section" key={si}>
            <div className="nav-section-title">{section.title}</div>
            {section.links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end={link.end}
              >
                <span className="icon">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">{user?.name}</div>
        <button className="logout-btn" onClick={handleLogout}>🚪 Sign Out</button>
      </div>
    </div>
  );
}
