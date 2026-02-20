import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const NAV = [
  { title: 'Main', links: [
    { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  ]},
  { title: 'Timetable', links: [
    { to: '/admin/timetable', icon: '📅', label: 'Manage Timetables' },
    { to: '/admin/view-all', icon: '👁️', label: 'View All' },
  ]},
  { title: 'Management', links: [
    { to: '/admin/courses', icon: '📚', label: 'Courses' },
    { to: '/admin/teachers', icon: '👨‍🏫', label: 'Teachers' },
    { to: '/admin/classrooms', icon: '🏫', label: 'Classrooms' },
    { to: '/admin/departments', icon: '🏛️', label: 'Departments' },
    { to: '/admin/batches', icon: '👥', label: 'Student Batches' },
  ]},
  { title: 'Requests', links: [
    { to: '/admin/requests', icon: '📨', label: 'Change Requests' },
  ]},
];

export default function AdminLayout() {
  return (
    <div className="app-layout">
      <Sidebar items={NAV} role="Admin" />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
