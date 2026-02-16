import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast, useConfirm } from '../../components/UI';

export default function ManageLectures() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, ConfirmDialog] = useConfirm();

  const load = () => {
    if (!user?.linkedId) return;
    setLoading(true);
    api.getTeacherTimetable(user.linkedId)
      .then(r => setEntries(r.data))
      .catch(() => toast('Failed to load', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const cancelLecture = async (entry) => {
    if (!await confirm('Cancel Lecture', `Cancel ${entry.courseCode} on ${entry.day} ${entry.slotLabel}?`)) return;
    try {
      await api.cancelLecture(entry.id);
      toast('Lecture cancelled', 'success');
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

  const active = entries.filter(e => e.status !== 'cancelled');
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
                  <button className="btn btn-sm btn-danger" onClick={() => cancelLecture(e)}>Cancel</button>
                </td>
              </tr>
            ))}
            {active.length === 0 && <tr><td colSpan={6} className="text-center">No active lectures</td></tr>}
          </tbody>
        </table>
      </div>

      {cancelled.length > 0 && (
        <>
          <h2 style={{ marginBottom: 12 }}>Cancelled Lectures ({cancelled.length})</h2>
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
