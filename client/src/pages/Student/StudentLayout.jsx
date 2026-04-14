import React from 'react';
import { Outlet } from 'react-router-dom';
import { ClipboardList, CalendarDays, BookOpen, Target } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import WorkspaceHeader from '../../components/WorkspaceHeader';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { title: 'Schedule', links: [
    { to: '/student', icon: ClipboardList, label: 'Daily View', end: true },
    { to: '/student/weekly', icon: CalendarDays, label: 'Weekly View' },
  ]},
  { title: 'Info', links: [
    { to: '/student/courses', icon: BookOpen, label: 'My Courses' },
    { to: '/student/electives', icon: Target, label: 'Choose Electives' },
  ]},
];

export default function StudentLayout() {
  const { user } = useAuth();
  return (
    <div className="app-layout">
      <Sidebar items={NAV} role="Student" />
      <div className="main-content">
        <WorkspaceHeader role="Student" userName={user?.name} />
        <div className="content-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
