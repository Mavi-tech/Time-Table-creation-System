import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast } from '../../components/UI';

export default function StudentCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.departmentId) return;
    Promise.all([api.getCourses(), api.getTeachers(), api.getEnrollments(user.id)])
      .then(([cr, tr, er]) => {
        const myCourses = cr.data.filter(c => {
          const cDepts = c.departmentIds || (c.departmentId ? [c.departmentId] : []);
          return cDepts.includes(user.departmentId) && c.year === user.year;
        });
        setCourses(myCourses);
        setTeachers(tr.data);
        setEnrollments(er.data);
      })
      .catch(() => toast('Failed to load courses', 'error'))
      .finally(() => setLoading(false));
  }, [user]);

  const enrolledIds = useMemo(() => new Set(enrollments.map(e => e.courseId)), [enrollments]);

  // Mandatory = not elective; Elective = isElective AND enrolled
  const mandatory = courses.filter(c => !c.isElective);
  const enrolledElectives = courses.filter(c => c.isElective && enrolledIds.has(c.id));
  const allMyCourses = [...mandatory, ...enrolledElectives];

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div>
      <h1 className="page-title">My Courses</h1>

      {allMyCourses.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📚</span>
          <p>No courses found for your department and year.</p>
        </div>
      ) : (
        <>
          {mandatory.length > 0 && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>
                📖 Mandatory Courses ({mandatory.length})
              </h2>
              <div className="cards-grid" style={{ marginBottom: 28 }}>
                {mandatory.map(c => {
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
            </>
          )}

          {enrolledElectives.length > 0 && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#f59e0b' }}>
                🎯 Elective Courses ({enrolledElectives.length})
              </h2>
              <div className="cards-grid">
                {enrolledElectives.map(c => {
                  const teacher = teachers.find(t => t.id === c.teacherId);
                  return (
                    <div className="card" key={c.id} style={{ borderLeft: '4px solid #f59e0b' }}>
                      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-lecture">{c.code}</span>
                        <span className="badge" style={{ background: '#f59e0b', color: '#fff', fontSize: 10 }}>Elective</span>
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
            </>
          )}
        </>
      )}
    </div>
  );
}
