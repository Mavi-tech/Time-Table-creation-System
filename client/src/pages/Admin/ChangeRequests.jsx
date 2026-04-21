import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { toast, useConfirm } from '../../components/UI';

export default function ChangeRequests() {
  const [requests, setRequests] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [confirm, ConfirmDialog] = useConfirm();

  const load = useCallback(() => {
    Promise.all([api.getRequests(), api.getAllTimetables()])
      .then(([reqRes, ttRes]) => {
        setRequests(reqRes.data || []);
        setTimetables(ttRes.data || []);
      })
      .catch(() => toast('Failed to load change requests', 'error'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handle = async (id, status) => {
    const word = status === 'approved' ? 'approve' : 'reject';
    if (!await confirm(`${word.charAt(0).toUpperCase() + word.slice(1)} Request`, `Are you sure you want to ${word} this request?`)) return;
    try {
      await api.updateRequest(id, { status });
      toast(`Request ${status}`, 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Failed', 'error');
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status !== 'pending');

  const getCoverageStatus = (request) => {
    const targetId = request.entryId || request.timetableId;
    if (!targetId) return null;

    const requestedLecture = timetables.find(t => t.id === targetId);
    if (!requestedLecture) return null;

    if (requestedLecture.status === 'cancelled') {
      return { label: 'Permanently cancelled', tone: 'danger' };
    }

    if (requestedLecture.status === 'temp_cancelled') {
      const covering = timetables.find(t => t.substituteForId === requestedLecture.id);
      if (covering) {
        return {
          label: `Covered by ${covering.teacherName || 'another teacher'}`,
          tone: 'success',
        };
      }
      return { label: 'Not covered yet', tone: 'warning' };
    }

    return null;
  };

  return (
    <div>
      <ConfirmDialog />
      <h1 className="page-title">Change Requests</h1>

      <h2 style={{ marginBottom: 12 }}>Pending ({pending.length})</h2>
      {pending.length === 0 ? (
        <div className="empty-state" style={{ padding: 32 }}>
          <p>No pending requests</p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ marginBottom: 32 }}>
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Type</th>
                <th>Details</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(r => {
                const coverage = getCoverageStatus(r);
                return (
                  <tr key={r.id}>
                    <td><strong>{r.teacherName}</strong></td>
                    <td><span className={`badge badge-${r.type}`}>{r.type}</span></td>
                    <td>
                      {r.courseName && <div>{r.courseCode} - {r.courseName}</div>}
                      <div className="text-sm">{r.day} {r.slotLabel || r.slot}</div>
                      {r.newDay && <div className="text-sm">→ {r.newDay} {r.newSlot}</div>}
                      {coverage && (
                        <div className="text-sm" style={{ marginTop: 4 }}>
                          <span className={`badge badge-${coverage.tone}`}>{coverage.label}</span>
                        </div>
                      )}
                    </td>
                    <td>{r.reason || '-'}</td>
                    <td className="text-sm">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => handle(r.id, 'approved')}>Approve</button>{' '}
                      <button className="btn btn-sm btn-danger" onClick={() => handle(r.id, 'rejected')}>Reject</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ marginBottom: 12 }}>Resolved ({resolved.length})</h2>
      {resolved.length === 0 ? (
        <div className="empty-state" style={{ padding: 32 }}>
          <p>No resolved requests</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Type</th>
                <th>Details</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {resolved.map(r => {
                const coverage = getCoverageStatus(r);
                return (
                  <tr key={r.id}>
                    <td>{r.teacherName}</td>
                    <td><span className={`badge badge-${r.type}`}>{r.type}</span></td>
                    <td>
                      {r.courseName && <div>{r.courseCode} - {r.courseName}</div>}
                      <div className="text-sm">{r.day} {r.slotLabel || r.slot}</div>
                      {coverage && (
                        <div className="text-sm" style={{ marginTop: 4 }}>
                          <span className={`badge badge-${coverage.tone}`}>{coverage.label}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${r.status === 'approved' ? 'success' : 'danger'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="text-sm">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
