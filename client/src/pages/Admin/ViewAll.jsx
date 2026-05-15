import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api';
import { toast } from '../../components/UI';
import TimetableGrid from '../../components/TimetableGrid';

export default function ViewAll() {
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [mode, setMode] = useState('dept'); // dept | teacher
  const [selDept, setSelDept] = useState('');
  const [selSem, setSelSem] = useState(1);
  const [selTeacher, setSelTeacher] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selBatch, setSelBatch] = useState('');

  useEffect(() => {
    api.getDepartments().then(r => { setDepartments(r.data); if (r.data.length) setSelDept(r.data[0].id); });
    api.getTeachers().then(r => { setTeachers(r.data); if (r.data.length) setSelTeacher(r.data[0].id); });
  }, []);

  const load = () => {
    setLoading(true);
    const promise = mode === 'dept'
      ? api.getTimetable(selDept, selSem)
      : api.getTeacherTimetable(selTeacher);
    promise
      .then(r => setEntries(r.data))
      .catch(() => { setEntries([]); toast('No timetable data found', 'info'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (mode === 'dept' && selDept) load();
    if (mode === 'teacher' && selTeacher) load();
    /* eslint-disable-next-line */
  }, [mode, selDept, selSem, selTeacher]);

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  // Detect batches in loaded entries
  const batches = useMemo(() => {
    const seen = new Map();
    entries.forEach(e => {
      if (e.batchId && !seen.has(e.batchId)) {
        seen.set(e.batchId, { id: e.batchId, section: e.batchSection || e.batchId });
      }
    });
    return Array.from(seen.values());
  }, [entries]);

  // Filter entries by selected batch
  const displayedEntries = useMemo(() => {
    // When viewing by teacher, show all entries for that teacher (don't hide batch-specific rows)
    if (mode === 'teacher') return entries;

    if (batches.length === 0) return entries;
    if (!selBatch) return entries.filter(e => !e.batchId);
    return entries.filter(e => e.batchId === selBatch || !e.batchId);
  }, [entries, selBatch, batches]);

  // Auto-select first batch when entries change
  useEffect(() => {
    if (batches.length > 0 && !batches.find(b => b.id === selBatch)) {
      setSelBatch(batches[0].id);
    } else if (batches.length === 0) {
      setSelBatch('');
    }
  }, [batches]);

  return (
    <div>
      <h1 className="page-title">View All Timetables</h1>

      <div className="toolbar">
        <div className="btn-group">
          <button className={`btn ${mode === 'dept' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('dept')}>
            By Department
          </button>
          <button className={`btn ${mode === 'teacher' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('teacher')}>
            By Teacher
          </button>
        </div>

        {mode === 'dept' && (
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
                {[1, 2, 3, 4].map(yr => (
                  <optgroup key={yr} label={`Year ${yr}`}>
                    <option value={yr * 2 - 1}>Semester {yr * 2 - 1}</option>
                    <option value={yr * 2}>Semester {yr * 2}</option>
                  </optgroup>
                ))}
              </select>
            </div>
            {batches.length > 0 && (
              <div className="form-group">
                <label>Batch / Section</label>
                <select value={selBatch} onChange={e => setSelBatch(e.target.value)}>
                  {batches.map(b => <option key={b.id} value={b.id}>Section {b.section}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {mode === 'teacher' && (
          <div className="form-row">
            <div className="form-group">
              <label>Teacher</label>
              <select value={selTeacher} onChange={e => setSelTeacher(e.target.value)}>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : displayedEntries.length > 0 ? (
        <TimetableGrid entries={displayedEntries} />
      ) : (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🔍</span>
          <p>No timetable data available.</p>
        </div>
      )}
    </div>
  );
}
