import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const COLLEGE_LOGO_URL = 'https://mssu.ac.in/wp-content/uploads/2022/11/MSSU-Logo_home-1-430x330.png';

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
        <div className="sidebar-brand">
          <img className="brand-logo" src={COLLEGE_LOGO_URL} alt="MSSU Logo" />
          <h2>
            Timetable System
          </h2>
          <small>RTMSSU Campus Planner</small>
        </div>
        <span className="role-badge">{role}</span>
      </div>
      <nav className="sidebar-nav">
        {items.map((section, si) => (
          <div className="nav-section" key={si}>
            <div className="nav-section-title">{section.title}</div>
            {section.links.map(link => {
              const LinkIcon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  end={link.end}
                >
                  <span className="icon" aria-hidden="true">
                    {LinkIcon && <LinkIcon size={18} strokeWidth={2} />}
                  </span>
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">{user?.name}</div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
