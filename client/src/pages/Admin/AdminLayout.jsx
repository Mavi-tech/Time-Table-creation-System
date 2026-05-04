import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Eye,
  BookOpen,
  Users,
  School,
  Building2,
  Layers,
  MessagesSquare,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import WorkspaceHeader from '../../components/WorkspaceHeader';

const NAV = [
  { title: 'Main', links: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  ]},
  { title: 'Timetable', links: [
    { to: '/admin/timetable', icon: CalendarDays, label: 'Manage Timetables' },
    { to: '/admin/view-all', icon: Eye, label: 'View All' },
  ]},
  { title: 'Management', links: [
    { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
    { to: '/admin/teachers', icon: Users, label: 'Teachers' },
    { to: '/admin/classrooms', icon: School, label: 'Classrooms' },
    { to: '/admin/departments', icon: Building2, label: 'Departments' },
    { to: '/admin/batches', icon: Layers, label: 'Student Batches' },
  ]},
  { title: 'System', links: [
    { to: '/admin/institutions', icon: Building2, label: 'Institutions' },
  ]},
  { title: 'Requests', links: [
    { to: '/admin/requests', icon: MessagesSquare, label: 'Change Requests' },
  ]},
];

export default function AdminLayout() {
  return (
    <div className="app-layout">
      <Sidebar items={NAV} role="Admin" />
      <div className="main-content">
        <WorkspaceHeader role="Admin" />
        <div className="content-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
