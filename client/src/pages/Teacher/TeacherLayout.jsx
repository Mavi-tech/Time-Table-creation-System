import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { title: 'Schedule', links: [
    { to: '/teacher', icon: '📋', label: 'Daily View', end: true },
    { to: '/teacher/weekly', icon: '📅', label: 'Weekly View' },
  ]},
  { title: 'Management', links: [
    { to: '/teacher/manage', icon: '⚙️', label: 'Manage Lectures' },
    { to: '/teacher/requests', icon: '📨', label: 'Change Requests' },
  ]},
];

export default function TeacherLayout() {
  const { user } = useAuth();
  return (
    <div className="app-layout">
      <Sidebar items={NAV} role="Teacher" userName={user?.name} />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
