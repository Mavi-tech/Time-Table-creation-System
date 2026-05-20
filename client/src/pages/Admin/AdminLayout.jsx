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
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#CCFBF1] blur-[120px] opacity-70" />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#ECFEFF] blur-[120px] opacity-70" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[#DBEAFE] blur-[150px] opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(226,232,240,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.5)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <Sidebar items={NAV} role="Admin" />
      
      <div className="flex-1 flex flex-col ml-0 lg:ml-[320px] min-h-screen relative z-10 w-full transition-all duration-300">
        <WorkspaceHeader role="Admin" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
