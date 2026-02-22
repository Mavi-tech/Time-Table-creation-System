import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast } from '../../components/UI';
import TimetableGrid from '../../components/TimetableGrid';

export default function StudentWeekly() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.departmentId || !user?.semester) return;
    setLoading(true);
    Promise.all([
      api.getTimetable(user.departmentId, user.semester),
      api.getCourses(),
      api.getEnrollments(user.id),
    ])
      .then(([tr, cr, er]) => {
        setEntries(tr.data);
        setCourses(cr.data);
        setEnrollments(er.data);
      })
      .catch(() => toast('No timetable found', 'info'))
      .finally(() => setLoading(false));
  }, [user]);

  // Filter out elective courses the student hasn't enrolled in
  const enrolledIds = useMemo(() => new Set(enrollments.map(e => e.courseId)), [enrollments]);
  const electiveIds = useMemo(() => new Set(courses.filter(c => c.isElective).map(c => c.id)), [courses]);
  const active = useMemo(() => {
    return entries.filter(e => {
      if (e.status === 'cancelled') return false;
      if (electiveIds.has(e.courseId) && !enrolledIds.has(e.courseId)) return false;
      return true;
    });
  }, [entries, electiveIds, enrolledIds]);

  return (
    <div>
      <h1 className="page-title">Weekly Timetable</h1>
      <div style={{ marginBottom: 16 }}>
        <span className="badge badge-lecture" style={{ marginRight: 8 }}>Lectures: {active.filter(e => e.type === 'lecture').length}</span>
        <span className="badge badge-lab">Labs: {active.filter(e => e.type === 'lab').length}</span>
      </div>
      {loading ? (
        <div className="loading">Loading…</div>
      ) : active.length > 0 ? (
        <TimetableGrid entries={active} showRoom showTeacher />
      ) : (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📅</span>
          <p>No timetable generated yet for your class.</p>
        </div>
      )}
    </div>
  );
}
