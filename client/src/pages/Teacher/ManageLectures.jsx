import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast, useConfirm } from '../../components/UI';

export default function ManageLectures() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [currentTeacherId, setCurrentTeacherId] = useState('');
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
      setCurrentTeacherId(teacherIds[0] || '');
      if (teacherIds.length === 0) {
        setEntries([]);
        setAllEntries([]);
        setLoading(false);
        return;
      }
      api.getAllTimetables()
        .then(r => {
          const all = r.data || [];
          setAllEntries(all);
          setEntries(all.filter(e => teacherIds.includes(e.teacherId)));
        })
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

  const coverLecture = async (entry) => {
    if (!currentTeacherId) {
      toast('Could not resolve your teacher profile', 'error');
      return;
    }
    const ok = await confirm(
      'Take This Class?',
      `Take ${entry.courseCode} on ${entry.day} ${entry.slotLabel} as a substitute class?`
    );
    if (!ok) return;
    try {
      await api.coverCancelledLecture(entry.id, currentTeacherId);
      toast('Substitute class scheduled successfully', 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Failed', 'error');
    }
  };

  const cancelTakenLecture = async (entry) => {
    const ok = await confirm(
      'Cancel Taken Class?',
      `Cancel your substitute class for ${entry.courseCode} on ${entry.day} ${entry.slotLabel}?`
    );
    if (!ok) return;
    try {
      await api.releaseCoveredLecture(entry.id);
      toast('Taken class cancelled', 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Failed', 'error');
    }
  };

  const active = entries.filter(e => e.status === 'active' && !e.substituteForId);
  const tempCancelled = entries.filter(e => e.status === 'temp_cancelled');
  const cancelled = entries.filter(e => e.status === 'cancelled');
  const myTeacherIds = new Set(entries.map(e => e.teacherId));
  const sourceById = new Map(allEntries.map(e => [e.id, e]));
  const coveredSourceIds = new Set(
    allEntries
      .filter(e => e.substituteForId && sourceById.get(e.substituteForId)?.status === 'temp_cancelled')
      .map(e => e.substituteForId)
  );
  const dayOrder = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5 };
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayIndex = dayOrder[todayName] ?? 0;
  const cancelledByOthers = allEntries.filter(
    e =>
      e.status === 'temp_cancelled' &&
      !myTeacherIds.has(e.teacherId) &&
      !coveredSourceIds.has(e.id) &&
      (dayOrder[e.day] ?? 99) >= todayIndex
  );
  const coveredByMe = allEntries.filter(e => {
    if (!e.substituteForId || e.teacherId !== currentTeacherId) return false;
    const source = sourceById.get(e.substituteForId);
    return source?.status === 'temp_cancelled';
  });

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

      {coveredByMe.length > 0 && (
        <>
          <h2 style={{ marginBottom: 12 }}>Extra Lectures ({coveredByMe.length})</h2>
          <div style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: 13 }}>
            These are temporary lectures you took from another teacher. They stay separate from your main schedule.
          </div>
          <div className="table-wrapper" style={{ marginBottom: 32 }}>
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {coveredByMe.map(e => (
                  <tr key={e.id} style={{ background: '#ecfdf5' }}>
                    <td>{e.courseCode} - {e.courseName}</td>
                    <td>{e.day}</td>
                    <td>{e.slotLabel}</td>
                    <td>{e.classroomName}</td>
                    <td><span className={`badge badge-${e.type}`}>{e.type}</span></td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => cancelTakenLecture(e)}>
                        Cancel Extra Lecture
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 style={{ marginBottom: 12 }}>Cancelled This Week By Other Teachers ({cancelledByOthers.length})</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Teacher</th>
              <th>Day</th>
              <th>Time</th>
              <th>Room</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {cancelledByOthers.map(e => (
              <tr key={e.id} style={{ background: '#fff7ed' }}>
                <td>{e.courseCode} - {e.courseName}</td>
                <td>{e.teacherName || 'Unknown'}</td>
                <td>{e.day}</td>
                <td>{e.slotLabel}</td>
                <td>{e.classroomName}</td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => coverLecture(e)}>Take This Class</button>
                </td>
              </tr>
            ))}
            {cancelledByOthers.length === 0 && (
              <tr><td colSpan={6} className="text-center">No week-cancelled slots available right now</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
