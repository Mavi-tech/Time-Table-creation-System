import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast } from '../../components/UI';
import TimetableGrid from '../../components/TimetableGrid';

export default function TeacherWeekly() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
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
        .then(r => {
          const all = r.data || [];
          setEntries(all.filter(e => teacherIds.includes(e.teacherId)));
        })
        .catch(() => toast('Failed to load timetable', 'error'))
        .finally(() => mounted && setLoading(false));
    });
    return () => { mounted = false; };
  }, [getTeacherIdCandidates]);

  const active = entries.filter(e => e.status !== 'cancelled');

  return (
    <div>
      <h1 className="page-title">Weekly Schedule</h1>
      <div style={{ marginBottom: 16 }}>
        <span className="badge badge-lecture" style={{ marginRight: 8 }}>Lectures: {active.filter(e => e.type === 'lecture').length}</span>
        <span className="badge badge-lab">Labs: {active.filter(e => e.type === 'lab').length}</span>
      </div>
      {loading ? (
        <div className="loading">Loading…</div>
      ) : active.length > 0 ? (
        <TimetableGrid entries={active} showRoom showDept />
      ) : (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📅</span>
          <p>No lectures assigned yet.</p>
        </div>
      )}
    </div>
  );
}
