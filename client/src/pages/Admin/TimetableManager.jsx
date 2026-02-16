import React, { useEffect, useState } from 'react';
import api from '../../api';
import { toast, Modal, useConfirm } from '../../components/UI';
import TimetableGrid from '../../components/TimetableGrid';

export default function TimetableManager() {
  const [departments, setDepartments] = useState([]);
  const [selDept, setSelDept] = useState('');
  const [selYear, setSelYear] = useState(1);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const load = () => {
    if (!selDept) return;
    setLoading(true);
    api.getTimetable(selDept, selYear)
      .then(r => setTimetable(r.data))
      .catch(() => setTimetable(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (selDept) load(); /* eslint-disable-next-line */ }, [selDept, selYear]);

  const generate = async () => {
    if (!selDept) return;
    if (!await confirm('Generate Timetable', `This will regenerate the timetable for year ${selYear}. Continue?`)) return;
    setLoading(true);
    try {
      const r = await api.generateTimetable(selDept, selYear);
      setTimetable(r.data.schedule || r.data);
      toast(`Timetable generated! ${r.data.placed || 0} entries placed.`, 'success');
      if (r.data.errors && r.data.errors.length > 0) {
        r.data.errors.forEach(err => toast(err, 'warning'));
      }
    } catch (e) {
      toast(e.response?.data?.error || 'Generation failed', 'error');
    }
    setLoading(false);
  };

  const generateAll = async () => {
    if (!selDept) return;
    if (!await confirm('Generate All Years', 'This will regenerate timetables for ALL years in this department. Continue?')) return;
    setLoading(true);
    try {
      const dept = departments.find(d => d.id === selDept);
      for (let y = 1; y <= (dept?.years || 4); y++) {
        await api.generateTimetable(selDept, y);
      }
      load();
      toast('All timetables generated!', 'success');
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
  const years = dept ? Array.from({ length: dept.years || 4 }, (_, i) => i + 1) : [];

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
            <label>Year</label>
            <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
              {years.map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={generate} disabled={loading}>
            {loading ? 'Working…' : '⚡ Generate'}
          </button>
          <button className="btn btn-secondary" onClick={generateAll} disabled={loading}>
            📋 Generate All Years
          </button>
        </div>
      </div>

      {loading && <div className="loading">Loading…</div>}

      {!loading && timetable && timetable.length > 0 && (
        <TimetableGrid entries={timetable} onCellClick={handleEntryClick} />
      )}
      {!loading && timetable && timetable.length === 0 && (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📅</span>
          <p>No timetable generated yet for this department/year.</p>
          <button className="btn btn-primary" onClick={generate}>Generate Now</button>
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
                {courses.filter(c => c.departmentId === selDept).map(c => (
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
