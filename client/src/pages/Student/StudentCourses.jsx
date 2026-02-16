import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast } from '../../components/UI';

export default function StudentCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.departmentId) return;
    Promise.all([api.getCourses(), api.getTeachers()])
      .then(([cr, tr]) => {
        const myCourses = cr.data.filter(c => c.departmentId === user.departmentId && c.year === user.year);
        setCourses(myCourses);
        setTeachers(tr.data);
      })
      .catch(() => toast('Failed to load courses', 'error'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div>
      <h1 className="page-title">My Courses</h1>

      {courses.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📚</span>
          <p>No courses found for your department and year.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {courses.map(c => {
            const teacher = teachers.find(t => t.id === c.teacherId);
            return (
              <div className="card" key={c.id}>
                <div className="card-header">
                  <span className="badge badge-lecture">{c.code}</span>
                </div>
                <h3>{c.name}</h3>
                <div className="card-details">
                  <div><strong>Instructor:</strong> {teacher?.name || 'TBA'}</div>
                  <div><strong>Lectures/Week:</strong> {c.weeklyLectures}</div>
                  {c.weeklyLabs > 0 && <div><strong>Lab Sessions/Week:</strong> {c.weeklyLabs}</div>}
                  <div>
                    <span className={`badge badge-${c.weeklyLabs > 0 ? 'lab' : 'lecture'}`} style={{ marginTop: 8 }}>
                      {c.weeklyLabs > 0 ? 'Has Lab Component' : 'Theory Only'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
