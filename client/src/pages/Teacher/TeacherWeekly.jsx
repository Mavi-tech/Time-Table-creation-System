import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast } from '../../components/UI';
import TimetableGrid from '../../components/TimetableGrid';

export default function TeacherWeekly() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.linkedId) return;
    setLoading(true);
    api.getTeacherTimetable(user.linkedId)
      .then(r => setEntries(r.data))
      .catch(() => toast('Failed to load timetable', 'error'))
      .finally(() => setLoading(false));
  }, [user]);

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
