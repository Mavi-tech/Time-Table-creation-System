import React, { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from '../../components/UI';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getDepartments(),
      api.getCourses(),
      api.getTeachers(),
      api.getClassrooms(),
      api.getRequests(),
    ]).then(([depts, courses, teachers, rooms, reqs]) => {
      setStats({
        departments: depts.data.length,
        courses: courses.data.length,
        teachers: teachers.data.length,
        classrooms: rooms.data.length,
        pending: reqs.data.filter(r => r.status === 'pending').length,
      });
    }).catch(() => toast('Failed to load stats', 'error'));
  }, []);

  if (!stats) return <div className="loading">Loading dashboard…</div>;

  const cards = [
    { label: 'Departments', value: stats.departments, icon: '🏛️', color: '#4f46e5' },
    { label: 'Courses', value: stats.courses, icon: '📚', color: '#0891b2' },
    { label: 'Teachers', value: stats.teachers, icon: '👨‍🏫', color: '#059669' },
    { label: 'Classrooms', value: stats.classrooms, icon: '🏫', color: '#d97706' },
    { label: 'Pending Requests', value: stats.pending, icon: '📨', color: '#dc2626' },
  ];

  return (
    <div>
      <h1 className="page-title">Admin Dashboard</h1>
      <div className="stats-grid">
        {cards.map(c => (
          <div className="stat-card" key={c.label} style={{ borderTop: `4px solid ${c.color}` }}>
            <div style={{ fontSize: 32 }}>{c.icon}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
