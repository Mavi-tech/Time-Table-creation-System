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
  const myEntries = useMemo(() => {
    return entries.filter(e => {
      if (e.status === 'cancelled') return false;
      // If course is elective, only show if student enrolled
      if (electiveIds.has(e.courseId) && !enrolledIds.has(e.courseId)) return false;
      return true;
    });
  }, [entries, electiveIds, enrolledIds]);

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
