import React, { useEffect, useState } from 'react';
import api from '../../api';
import { toast, Modal, useConfirm } from '../../components/UI';
import TimetableGrid from '../../components/TimetableGrid';

export default function TimetableManager() {
  const [departments, setDepartments] = useState([]);
  const [selDept, setSelDept] = useState('');
  const [selSem, setSelSem] = useState(1);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selBatch, setSelBatch] = useState('');
  const [deptBatches, setDeptBatches] = useState([]);

  /* edit modal */
  const [editing, setEditing] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [confirm, ConfirmDialog] = useConfirm();

  useEffect(() => {
    api.getDepartments().then(r => { setDepartments(r.data); if (r.data.length) setSelDept(r.data[0].id); });
    api.getTeachers().then(r => setTeachers(r.data));
    api.getClassrooms().then(r => setClassrooms(r.data));
    api.getCourses().then(r => setCourses(r.data));
  }, []);

  // Fetch batches when department changes
  useEffect(() => {
    if (selDept) {
      api.getBatches(selDept).then(r => setDeptBatches(r.data || []));
    } else {
      setDeptBatches([]);
    }
  }, [selDept]);

  // Batches for current semester's year
  const semBatches = React.useMemo(() => {
    const year = Math.ceil(selSem / 2);
    return deptBatches.filter(b => b.year === year);
  }, [deptBatches, selSem]);

  const load = () => {
    if (!selDept) return;
    setLoading(true);
    api.getTimetable(selDept, selSem)
      .then(r => setTimetable(r.data))
      .catch(() => setTimetable(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (selDept) load(); /* eslint-disable-next-line */ }, [selDept, selSem]);

  const generate = async (specificBatchId) => {
    if (!selDept) return;
    const batchLabel = specificBatchId
      ? ` for Batch ${semBatches.find(b => b.id === specificBatchId)?.section || '?'}`
      : semBatches.length > 0 ? ' for all batches' : '';
    if (!await confirm('Generate Timetable', `This will regenerate the timetable for semester ${selSem}${batchLabel}. Continue?`)) return;
    setLoading(true);
    try {
      const r = await api.generateTimetable(selDept, selSem, 'week', specificBatchId || null);
      setTimetable(r.data.schedule || r.data);
      toast(`Timetable generated! ${r.data.placed || 0} entries placed${r.data.batches ? ` (${r.data.batches} batches)` : ''}.`, 'success');
      if (r.data.errors && r.data.errors.length > 0) {
        r.data.errors.forEach(err => toast(err, 'warning'));
      }
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Generation failed', 'error');
    }
    setLoading(false);
  };

  const generateAll = async () => {
    if (!selDept) return;
    if (!await confirm('Generate All Semesters', 'This will regenerate timetables for ALL semesters in this department. Continue?')) return;
    setLoading(true);
    try {
      for (let s = 1; s <= 8; s++) {
        await api.generateTimetable(selDept, s);
      }
      load();
      toast('All semester timetables generated!', 'success');
    } catch (e) {
      toast(e.response?.data?.error || 'Generation failed', 'error');
    }
    setLoading(false);
  };

  /* edit entry */
  const handleEntryClick = (entry) => {
    setEditing({ ...entry });
  };

  const saveEntry = async () => {
    try {
      await api.updateEntry(editing.id, editing);
      toast('Entry updated', 'success');
      setEditing(null);
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Update failed', 'error');
    }
  };

  const deleteEntry = async () => {
    if (!await confirm('Delete Entry', 'Remove this entry from the timetable?')) return;
    try {
      await api.deleteEntry(editing.id);
      toast('Entry deleted', 'success');
      setEditing(null);
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const dept = departments.find(d => d.id === selDept);

  // Detect batches in the loaded timetable (for viewing)
  const ttBatches = React.useMemo(() => {
    if (!timetable) return [];
    const seen = new Map();
    timetable.forEach(e => {
      if (e.batchId && !seen.has(e.batchId)) {
        seen.set(e.batchId, { id: e.batchId, section: e.batchSection || e.batchId });
      }
    });
    return Array.from(seen.values());
  }, [timetable]);

  // Filter timetable by selected batch
  const displayedEntries = React.useMemo(() => {
    if (!timetable) return [];
    if (ttBatches.length === 0) return timetable; // no batches, show everything
    if (!selBatch) return timetable.filter(e => !e.batchId); // show non-batch entries only (fallback)
    return timetable.filter(e => e.batchId === selBatch || !e.batchId);
  }, [timetable, selBatch, ttBatches]);

  // Auto-select first batch when timetable loads
  React.useEffect(() => {
    if (ttBatches.length > 0 && !ttBatches.find(b => b.id === selBatch)) {
      setSelBatch(ttBatches[0].id);
    } else if (ttBatches.length === 0) {
      setSelBatch('');
    }
  }, [ttBatches]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <ConfirmDialog />
      <h1 className="page-title">Timetable Management</h1>

      <div className="toolbar">
        <div className="form-row">
          <div className="form-group">
            <label>Department</label>
            <select value={selDept} onChange={e => setSelDept(e.target.value)}>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Semester</label>
            <select value={selSem} onChange={e => setSelSem(Number(e.target.value))}>
              {Array.from({ length: dept?.years || 4 }, (_, i) => i + 1).map(yr => (
                <optgroup key={yr} label={`Year ${yr}`}>
                  <option value={yr * 2 - 1}>Semester {yr * 2 - 1}</option>
                  <option value={yr * 2}>Semester {yr * 2}</option>
                </optgroup>
              ))}
            </select>
          </div>
          {ttBatches.length > 0 && (
            <div className="form-group">
              <label>View Batch</label>
              <select value={selBatch} onChange={e => setSelBatch(e.target.value)}>
                {ttBatches.map(b => <option key={b.id} value={b.id}>Section {b.section}</option>)}
              </select>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="btn-group">
            <button className="btn btn-primary" onClick={() => generate()} disabled={loading}>
              {loading ? 'Working…' : semBatches.length > 0 ? '⚡ Generate All Batches' : '⚡ Generate'}
            </button>
            <button className="btn btn-secondary" onClick={generateAll} disabled={loading}>
              📋 Generate All Semesters
            </button>
          </div>
          {semBatches.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Generate batch:</span>
              {semBatches.map(b => (
                <button
                  key={b.id}
                  className="btn btn-sm btn-secondary"
                  onClick={() => generate(b.id)}
                  disabled={loading}
                  style={{ fontSize: 11, padding: '4px 10px' }}
                >
                  👥 {b.name} ({b.section}) — {b.studentCount} students
                </button>
              ))}
            </div>
          )}
          {semBatches.length > 0 && (
            <div style={{
              fontSize: 11, color: 'var(--primary)', background: '#eff6ff',
              padding: '4px 10px', borderRadius: 6, fontWeight: 500
            }}>
              ℹ️ {semBatches.length} batch{semBatches.length !== 1 ? 'es' : ''} found for Year {Math.ceil(selSem / 2)} — timetable will be generated separately per batch
            </div>
          )}
        </div>
      </div>

      {loading && <div className="loading">Loading…</div>}

      {!loading && timetable && timetable.length > 0 && (
        <TimetableGrid entries={displayedEntries} onCellClick={handleEntryClick} />
      )}
      {!loading && timetable && timetable.length === 0 && (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📅</span>
          <p>No timetable generated yet for this department/semester.</p>
          <button className="btn btn-primary" onClick={() => generate()}>Generate Now</button>
        </div>
      )}

      {/* Edit Entry Modal */}
      <Modal title="Edit Timetable Entry" open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <div className="form">
            <div className="form-group">
              <label>Course</label>
              <select value={editing.courseId || ''} onChange={e => {
                const c = courses.find(x => x.id === e.target.value);
                setEditing({ ...editing, courseId: e.target.value, courseName: c?.name || '', courseCode: c?.code || '' });
              }}>
                <option value="">Select</option>
                {courses.filter(c => {
                  const cDepts = c.departmentIds || (c.departmentId ? [c.departmentId] : []);
                  return cDepts.includes(selDept);
                }).map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Teacher</label>
              <select value={editing.teacherId || ''} onChange={e => {
                const t = teachers.find(x => x.id === e.target.value);
                setEditing({ ...editing, teacherId: e.target.value, teacherName: t?.name || '' });
              }}>
                <option value="">Select</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Classroom</label>
              <select value={editing.classroomId || ''} onChange={e => {
                const r = classrooms.find(x => x.id === e.target.value);
                setEditing({ ...editing, classroomId: e.target.value, classroomName: r?.name || '' });
              }}>
                <option value="">Select</option>
                {classrooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Day</label>
                <input value={editing.day || ''} readOnly className="readonly" />
              </div>
              <div className="form-group">
                <label>Slot</label>
                <input value={editing.slotLabel || ''} readOnly className="readonly" />
              </div>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={editing.type || 'lecture'} onChange={e => setEditing({ ...editing, type: e.target.value })}>
                <option value="lecture">Lecture</option>
                <option value="lab">Lab</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={deleteEntry}>Delete</button>
              <button className="btn btn-primary" onClick={saveEntry}>Save</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
