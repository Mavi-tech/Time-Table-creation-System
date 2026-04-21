import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { toast, Modal } from '../../components/UI';
import { DAYS, SLOTS } from '../../components/TimetableGrid';

export default function TeacherRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [entries, setEntries] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ entryId: '', type: 'reschedule', reason: '', newDay: '', newSlot: '' });

  const resolveTeacherId = useCallback(async () => {
    if (!user) return '';

    if (user.linkedId) {
      try {
        const tr = await api.getTeachers();
        const exists = (tr.data || []).some(t => t.id === user.linkedId);
        if (exists) return user.linkedId;
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

  const load = useCallback(async () => {
    try {
      const teacherIds = await getTeacherIdCandidates();
      setTeacherId(teacherIds[0] || '');

      const [requestsRes, entriesRes] = await Promise.all([
        api.getRequests(),
        teacherIds.length > 0 ? api.getAllTimetables() : Promise.resolve({ data: [] }),
      ]);

      const allRequests = requestsRes.data || [];
      setRequests(allRequests.filter(req => teacherIds.includes(req.teacherId)));

      const allEntries = entriesRes.data || [];
      setEntries(
        allEntries.filter(e =>
          teacherIds.includes(e.teacherId) &&
          e.status !== 'cancelled' &&
          e.status !== 'temp_cancelled'
        )
      );
    } catch {
      toast('Failed to load change requests', 'error');
      setRequests([]);
      setEntries([]);
    }
  }, [getTeacherIdCandidates]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.entryId) { toast('Select a lecture', 'error'); return; }
    if (!form.reason?.trim()) { toast('Reason is required', 'error'); return; }
    if (form.type === 'reschedule' && (!form.newDay || !form.newSlot)) {
      toast('Select new day and new time for reschedule request', 'error');
      return;
    }
    const entry = entries.find(e => e.id === form.entryId);
    if (!entry) {
      toast('Selected lecture no longer exists', 'error');
      return;
    }
    try {
      await api.createRequest({
        teacherId,
        teacherName: user.name,
        entryId: form.entryId,
        courseCode: entry?.courseCode,
        courseName: entry?.courseName,
        day: entry?.day,
        slotLabel: entry?.slotLabel,
        type: form.type,
        reason: form.reason,
        newDay: form.type === 'reschedule' ? form.newDay : undefined,
        newSlot: form.type === 'reschedule' ? form.newSlot : undefined,
      });
      toast('Request submitted', 'success');
      setShowModal(false);
      setForm({ entryId: '', type: 'reschedule', reason: '', newDay: '', newSlot: '' });
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Submit failed', 'error');
    }
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Change Requests</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Request</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Type</th>
              <th>Current</th>
              <th>Requested</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}>
                <td><strong>{r.courseCode}</strong></td>
                <td><span className={`badge badge-${r.type}`}>{r.type}</span></td>
                <td>{r.day} {r.slotLabel || r.slot}</td>
                <td>{r.newDay ? `${r.newDay} ${r.newSlot}` : '-'}</td>
                <td>{r.reason || '-'}</td>
                <td>
                  <span className={`badge badge-${r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="text-sm">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={7} className="text-center">No requests yet</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal title="New Change Request" open={showModal} onClose={() => setShowModal(false)}>
        <div className="form">
          <div className="form-group">
            <label>Lecture *</label>
            <select value={form.entryId} onChange={e => set('entryId', e.target.value)}>
              <option value="">Select lecture</option>
              {entries.map(e => (
                <option key={e.id} value={e.id}>{e.courseCode} — {e.day} {e.slotLabel}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="reschedule">Reschedule</option>
              <option value="cancel">Cancel</option>
              <option value="room-change">Room Change</option>
            </select>
          </div>
          {form.type === 'reschedule' && (
            <div className="form-row">
              <div className="form-group">
                <label>New Day</label>
                <select value={form.newDay} onChange={e => set('newDay', e.target.value)}>
                  <option value="">Select</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>New Time</label>
                <select value={form.newSlot} onChange={e => set('newSlot', e.target.value)}>
                  <option value="">Select</option>
                  {SLOTS.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Reason *</label>
            <textarea rows={3} value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Explain the reason for this request…" />
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={!teacherId}>Submit</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
