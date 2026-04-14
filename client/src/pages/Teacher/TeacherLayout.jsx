import React from 'react';
import { Outlet } from 'react-router-dom';
import { ClipboardList, CalendarDays, Settings, MessagesSquare } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import WorkspaceHeader from '../../components/WorkspaceHeader';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { title: 'Schedule', links: [
    { to: '/teacher', icon: ClipboardList, label: 'Daily View', end: true },
    { to: '/teacher/weekly', icon: CalendarDays, label: 'Weekly View' },
  ]},
  { title: 'Management', links: [
    { to: '/teacher/manage', icon: Settings, label: 'Manage Lectures' },
    { to: '/teacher/requests', icon: MessagesSquare, label: 'Change Requests' },
  ]},
];

export default function TeacherLayout() {
  const { user } = useAuth();
  return (
    <div className="app-layout">
      <Sidebar items={NAV} role="Teacher" />
      <div className="main-content">
        <WorkspaceHeader role="Teacher" userName={user?.name} />
        <div className="content-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
