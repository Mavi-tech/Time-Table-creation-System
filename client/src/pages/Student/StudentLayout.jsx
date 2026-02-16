import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { title: 'Schedule', links: [
    { to: '/student', icon: '📋', label: 'Daily View', end: true },
    { to: '/student/weekly', icon: '📅', label: 'Weekly View' },
  ]},
  { title: 'Info', links: [
    { to: '/student/courses', icon: '📚', label: 'My Courses' },
  ]},
];

export default function StudentLayout() {
  const { user } = useAuth();
  return (
    <div className="app-layout">
      <Sidebar items={NAV} role="Student" userName={user?.name} />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
