import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast } from '../../components/UI';
import DailyView from '../../components/DailyView';
import { DAYS } from '../../components/TimetableGrid';
import { resolveTeacherIdForUser } from '../../utils/teacherIdentity';

export default function TeacherDaily() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [selDay, setSelDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [assignedCourses, setAssignedCourses] = useState([]);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    setSelDay(DAYS.includes(today) ? today : 'Monday');
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([api.getTeachers(), api.getCourses(), resolveTeacherIdForUser(user, api)])
      .then(([teachersRes, coursesRes, teacherId]) => {
        if (!mounted) return;

        const teachers = teachersRes.data || [];
        const courses = coursesRes.data || [];
        const resolvedTeacher = teachers.find(t => t.id === teacherId) || null;
        setTeacherProfile(resolvedTeacher);
        setAssignedCourses(
          resolvedTeacher
            ? courses.filter(c => c.teacherId === resolvedTeacher.id || (resolvedTeacher.courseIds || []).includes(c.id))
            : []
        );

        if (!teacherId) {
          setEntries([]);
          setLoading(false);
          return;
        }

        return api.getTeacherTimetable(teacherId)
          .then(r => {
            setEntries(r.data || []);
          });
      })
      .catch(() => toast('Failed to load timetable', 'error'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [user]);

  const dayEntries = entries.filter(e => e.day === selDay && e.status !== 'cancelled');

  return (
    <div>
      <h1 className="page-title">Today's Schedule</h1>
      <div className="toolbar">
        <div className="btn-group">
          {DAYS.map(d => (
            <button key={d} className={`btn ${selDay === d ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelDay(d)}>
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="loading">Loading…</div>
      ) : dayEntries.length > 0 ? (
        <DailyView entries={dayEntries} day={selDay} showRoom showDept />
      ) : (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📅</span>
          <p>No timetable entries are assigned for {selDay}.</p>
          {(teacherProfile || assignedCourses.length > 0) && (
            <div style={{ marginTop: 18, width: '100%', maxWidth: 720, textAlign: 'left' }}>
              {teacherProfile && (
                <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                  <strong style={{ display: 'block', marginBottom: 6 }}>{teacherProfile.name}</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {teacherProfile.title || 'Teacher'}{teacherProfile.email ? ` • ${teacherProfile.email}` : ''}
                  </div>
                </div>
              )}
              {assignedCourses.length > 0 && (
                <div className="card" style={{ padding: 16 }}>
                  <strong style={{ display: 'block', marginBottom: 10 }}>Assigned Courses</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {assignedCourses.map(course => (
                      <span key={course.id} className="badge badge-primary">
                        {course.code} {course.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
