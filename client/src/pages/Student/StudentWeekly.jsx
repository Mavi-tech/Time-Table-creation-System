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
      api.getTimetable(user.departmentId, user.semester, undefined, user.batchId),
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
  const enrolledIds = useMemo(() => {
    const ids = new Set(enrollments.map(e => e.courseId));
    (user?.selectedElectiveCourseIds || []).forEach(id => ids.add(id));
    return ids;
  }, [enrollments, user]);
  const electiveIds = useMemo(() => new Set(courses.filter(c => c.isElective).map(c => c.id)), [courses]);
  const active = useMemo(() => {
    return entries.filter(e => {
      // If an entry is batch-specific, it must match the logged-in student's batch.
      if (e.batchId && e.batchId !== user?.batchId) return false;

      // Always show mandatory subjects. Electives are shown only when the student enrolled in them.
      if (electiveIds.has(e.courseId)) return enrolledIds.has(e.courseId);
      return true;
    });
  }, [entries, electiveIds, enrolledIds, user]);

  const activeCount = active.filter(e => e.status !== 'cancelled' && e.status !== 'temp_cancelled');

  return (
    <div>
      <h1 className="page-title">Weekly Timetable</h1>
      <div style={{ marginBottom: 16 }}>
        <span className="badge badge-lecture" style={{ marginRight: 8 }}>Lectures: {activeCount.filter(e => e.type === 'lecture').length}</span>
        <span className="badge badge-lab">Labs: {activeCount.filter(e => e.type === 'lab').length}</span>
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
