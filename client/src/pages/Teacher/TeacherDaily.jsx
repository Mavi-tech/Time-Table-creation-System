import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast } from '../../components/UI';
import DailyView from '../../components/DailyView';
import { DAYS } from '../../components/TimetableGrid';

export default function TeacherDaily() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [selDay, setSelDay] = useState('');
  const [loading, setLoading] = useState(true);

  const resolveTeacherId = useCallback(async () => {
    if (!user) return '';

    if (user.linkedId) {
      try {
        const tr = await api.getTeachers();
        if ((tr.data || []).some(t => t.id === user.linkedId)) return user.linkedId;
      } catch {
        return user.linkedId;
      }
    }

    try {
      const tr = await api.getTeachers();
      const teachers = tr.data || [];
      const uname = (user.username || '').trim().toLowerCase();
      const display = (user.name || '').trim().toLowerCase();
      const direct = teachers.find(t =>
        (t.name || '').trim().toLowerCase() === uname ||
        (t.name || '').trim().toLowerCase() === display ||
        ((t.email || '').split('@')[0] || '').trim().toLowerCase() === uname
      );
      const loose = teachers.find(t =>
        (uname && (t.name || '').toLowerCase().includes(uname)) ||
        (display && (t.name || '').toLowerCase().includes(display)) ||
        (uname && ((t.email || '').split('@')[0] || '').toLowerCase().includes(uname))
      );
      return (direct || loose || {}).id || user.linkedId || '';
    } catch {
      return user.linkedId || '';
    }
  }, [user]);

  const getTeacherIdCandidates = useCallback(async () => {
    const ids = new Set();
    if (user?.linkedId) ids.add(user.linkedId);
    const resolvedId = await resolveTeacherId();
    if (resolvedId) ids.add(resolvedId);
    return [...ids];
  }, [resolveTeacherId, user?.linkedId]);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    setSelDay(DAYS.includes(today) ? today : 'Monday');
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getTeacherIdCandidates().then((teacherIds) => {
      if (!mounted) return;
      if (teacherIds.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }
      api.getAllTimetables()
        .then(r => setEntries((r.data || []).filter(e => teacherIds.includes(e.teacherId))))
        .catch(() => toast('Failed to load timetable', 'error'))
        .finally(() => mounted && setLoading(false));
    });
    return () => { mounted = false; };
  }, [getTeacherIdCandidates]);

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
      ) : (
        <DailyView entries={dayEntries} day={selDay} showRoom showDept />
      )}
    </div>
  );
}
