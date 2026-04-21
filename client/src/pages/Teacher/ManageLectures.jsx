import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast, useConfirm } from '../../components/UI';

export default function ManageLectures() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, ConfirmDialog] = useConfirm();

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

  const load = () => {
    setLoading(true);
    getTeacherIdCandidates().then((teacherIds) => {
      if (teacherIds.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }
      api.getAllTimetables()
        .then(r => setEntries((r.data || []).filter(e => teacherIds.includes(e.teacherId))))
        .catch(() => toast('Failed to load', 'error'))
        .finally(() => setLoading(false));
    });
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const cancelLecture = async (entry) => {
    if (!await confirm('Cancel Permanently?', `Permanently cancel ${entry.courseCode} on ${entry.day} ${entry.slotLabel}?`)) return;
    try {
      await api.cancelLecture(entry.id);
      toast('Lecture cancelled permanently', 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Failed', 'error');
    }
  };

  const cancelTempLecture = async (entry) => {
    if (!await confirm('Cancel This Week Only?', `Cancel ${entry.courseCode} on ${entry.day} ${entry.slotLabel} for THIS WEEK? It will automatically return next week.`)) return;
    try {
      await api.cancelTempLecture(entry.id);
      toast('Lecture cancelled for this week', 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Failed', 'error');
    }
  };

  const restoreLecture = async (entry) => {
    try {
      await api.restoreLecture(entry.id);
      toast('Lecture restored', 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Failed', 'error');
    }
  };

  const active = entries.filter(e => e.status === 'active');
  const tempCancelled = entries.filter(e => e.status === 'temp_cancelled');
  const cancelled = entries.filter(e => e.status === 'cancelled');

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div>
      <ConfirmDialog />
      <h1 className="page-title">Manage Lectures</h1>

      <h2 style={{ marginBottom: 12 }}>Active Lectures ({active.length})</h2>
      <div className="table-wrapper" style={{ marginBottom: 32 }}>
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Day</th>
              <th>Time</th>
              <th>Room</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {active.map(e => (
              <tr key={e.id}>
                <td><strong>{e.courseCode}</strong> - {e.courseName}</td>
                <td>{e.day}</td>
                <td>{e.slotLabel}</td>
                <td>{e.classroomName}</td>
                <td><span className={`badge badge-${e.type}`}>{e.type}</span></td>
                <td>
                  <button className="btn btn-sm btn-secondary" style={{ marginRight: '8px' }} onClick={() => cancelTempLecture(e)}>Cancel This Week</button>
                  <button className="btn btn-sm btn-danger" onClick={() => cancelLecture(e)}>Cancel Permanently</button>
                </td>
              </tr>
            ))}
            {active.length === 0 && <tr><td colSpan={6} className="text-center">No active lectures</td></tr>}
          </tbody>
        </table>
      </div>

      {tempCancelled.length > 0 && (
        <>
          <h2 style={{ marginBottom: 12 }}>Cancelled This Week ({tempCancelled.length})</h2>
          <div className="table-wrapper" style={{ marginBottom: 32 }}>
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tempCancelled.map(e => (
                  <tr key={e.id} style={{ opacity: 0.8, background: '#fee2e2' }}>
                    <td>{e.courseCode} - {e.courseName}</td>
                    <td>{e.day}</td>
                    <td>{e.slotLabel}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => restoreLecture(e)}>Restore (Make Active)</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {cancelled.length > 0 && (
        <>
          <h2 style={{ marginBottom: 12 }}>Permanently Cancelled ({cancelled.length})</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cancelled.map(e => (
                  <tr key={e.id} style={{ opacity: 0.6 }}>
                    <td>{e.courseCode} - {e.courseName}</td>
                    <td>{e.day}</td>
                    <td>{e.slotLabel}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => restoreLecture(e)}>Restore</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
