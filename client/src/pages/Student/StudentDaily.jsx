import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast } from '../../components/UI';
import DailyView from '../../components/DailyView';
import { DAYS } from '../../components/TimetableGrid';

export default function StudentDaily() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selDay, setSelDay] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    setSelDay(DAYS.includes(today) ? today : 'Monday');
  }, []);

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
  const myEntries = useMemo(() => {
    return entries.filter(e => {
      // If an entry is batch-specific, it must match the logged-in student's batch.
      if (e.batchId && e.batchId !== user?.batchId) return false;

      // Always show mandatory subjects. Electives are shown only when the student enrolled in them.
      if (electiveIds.has(e.courseId)) return enrolledIds.has(e.courseId);
      return true;
    });
  }, [entries, electiveIds, enrolledIds, user]);

  const dayEntries = myEntries.filter(e => e.day === selDay);

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
      ) : (
        <DailyView entries={dayEntries} day={selDay} showRoom showTeacher />
      )}
    </div>
  );
}
