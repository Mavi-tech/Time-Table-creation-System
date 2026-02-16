import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast } from '../../components/UI';
import TimetableGrid from '../../components/TimetableGrid';

export default function StudentWeekly() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.departmentId || !user?.year) return;
    setLoading(true);
    api.getTimetable(user.departmentId, user.year)
      .then(r => setEntries(r.data))
      .catch(() => toast('No timetable found', 'info'))
      .finally(() => setLoading(false));
  }, [user]);

  const active = entries.filter(e => e.status !== 'cancelled');

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
