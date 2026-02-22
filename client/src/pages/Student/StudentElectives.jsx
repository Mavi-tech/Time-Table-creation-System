import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast } from '../../components/UI';

export default function StudentElectives() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null); // courseId being enrolled/unenrolled

  const load = useCallback(() => {
    if (!user?.departmentId) return;
    setLoading(true);
    Promise.all([
      api.getCourses(),
      api.getTeachers(),
      api.getDepartments(),
      api.getEnrollments(user.id),
    ])
      .then(([cr, tr, dr, er]) => {
        // Only show elective courses for the student's department + year
        const electives = cr.data.filter(c => {
          if (!c.isElective) return false;
          const cDepts = c.departmentIds || (c.departmentId ? [c.departmentId] : []);
          return cDepts.includes(user.departmentId) && c.year === user.year;
        });
        setCourses(electives);
        setTeachers(tr.data);
        setDepartments(dr.data);
        setEnrollments(er.data);
      })
      .catch(() => toast('Failed to load electives', 'error'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const teacherMap = useMemo(() => {
    const m = {};
    teachers.forEach(t => { m[t.id] = t; });
    return m;
  }, [teachers]);

  const deptMap = useMemo(() => {
    const m = {};
    departments.forEach(d => { m[d.id] = d; });
    return m;
  }, [departments]);

  const enrolledCourseIds = useMemo(() => {
    return new Set(enrollments.map(e => e.courseId));
  }, [enrollments]);

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await api.enroll(user.id, courseId);
      toast('Enrolled successfully!', 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Enrollment failed', 'error');
    } finally {
      setEnrolling(null);
    }
  };

  const handleUnenroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await api.unenroll(user.id, courseId);
      toast('Unenrolled successfully', 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Unenrollment failed', 'error');
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) return <div className="loading">Loading…</div>;

  const enrolled = courses.filter(c => enrolledCourseIds.has(c.id));
  const available = courses.filter(c => !enrolledCourseIds.has(c.id));

  return (
    <div>
      <h1 className="page-title">Choose Electives</h1>

      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24,
      }}>
        <div style={{
          padding: '12px 20px', borderRadius: 10, background: '#f0f9ff',
          border: '1px solid #bae6fd', flex: '1 1 200px',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0369a1' }}>{courses.length}</div>
          <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>Available Electives</div>
        </div>
        <div style={{
          padding: '12px 20px', borderRadius: 10, background: '#f0fdf4',
          border: '1px solid #bbf7d0', flex: '1 1 200px',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#15803d' }}>{enrolled.length}</div>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Enrolled</div>
        </div>
      </div>

      {/* Enrolled Courses */}
      {enrolled.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#15803d' }}>
            ✅ Your Enrolled Electives
          </h2>
          <div className="cards-grid" style={{ marginBottom: 32 }}>
            {enrolled.map(c => {
              const teacher = teacherMap[c.teacherId];
              const cDepts = c.departmentIds || [];
              return (
                <div className="card" key={c.id} style={{
                  borderLeft: '4px solid #22c55e',
                  position: 'relative',
                }}>
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-lecture">{c.code}</span>
                    <span className="badge" style={{ background: '#22c55e', color: '#fff', fontSize: 10 }}>Enrolled</span>
                  </div>
                  <h3>{c.name}</h3>
                  <div className="card-details">
                    <div><strong>Instructor:</strong> {teacher?.name || 'TBA'}</div>
                    <div><strong>Lectures/Week:</strong> {c.weeklyLectures}</div>
                    {c.weeklyLabs > 0 && <div><strong>Lab Sessions/Week:</strong> {c.weeklyLabs}</div>}
                    {c.credits && <div><strong>Credits:</strong> {c.credits}</div>}
                    <div style={{ marginTop: 4 }}>
                      {cDepts.map(dId => {
                        const d = deptMap[dId];
                        return d ? <span key={dId} className="badge badge-primary" style={{ marginRight: 4, fontSize: 10 }}>{d.code}</span> : null;
                      })}
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button
                      className="btn btn-sm btn-danger"
                      disabled={enrolling === c.id}
                      onClick={() => handleUnenroll(c.id)}
                      style={{ width: '100%' }}
                    >
                      {enrolling === c.id ? 'Removing…' : '✕ Drop This Course'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Available Courses */}
      {available.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#0369a1' }}>
            📚 Available Electives
          </h2>
          <div className="cards-grid">
            {available.map(c => {
              const teacher = teacherMap[c.teacherId];
              const cDepts = c.departmentIds || [];
              return (
                <div className="card" key={c.id} style={{
                  borderLeft: '4px solid #3b82f6',
                  position: 'relative',
                }}>
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-lecture">{c.code}</span>
                    <span className="badge" style={{ background: '#f59e0b', color: '#fff', fontSize: 10 }}>Elective</span>
                  </div>
                  <h3>{c.name}</h3>
                  <div className="card-details">
                    <div><strong>Instructor:</strong> {teacher?.name || 'TBA'}</div>
                    <div><strong>Lectures/Week:</strong> {c.weeklyLectures}</div>
                    {c.weeklyLabs > 0 && <div><strong>Lab Sessions/Week:</strong> {c.weeklyLabs}</div>}
                    {c.credits && <div><strong>Credits:</strong> {c.credits}</div>}
                    <div style={{ marginTop: 4 }}>
                      {cDepts.map(dId => {
                        const d = deptMap[dId];
                        return d ? <span key={dId} className="badge badge-primary" style={{ marginRight: 4, fontSize: 10 }}>{d.code}</span> : null;
                      })}
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={enrolling === c.id}
                      onClick={() => handleEnroll(c.id)}
                      style={{ width: '100%' }}
                    >
                      {enrolling === c.id ? 'Enrolling…' : '➕ Enroll in This Course'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {courses.length === 0 && (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🎯</span>
          <p>No elective courses available for your department and year right now.</p>
        </div>
      )}
    </div>
  );
}
