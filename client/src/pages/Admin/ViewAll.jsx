import React, { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from '../../components/UI';
import TimetableGrid from '../../components/TimetableGrid';

export default function ViewAll() {
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [mode, setMode] = useState('dept'); // dept | teacher
  const [selDept, setSelDept] = useState('');
  const [selYear, setSelYear] = useState(1);
  const [selTeacher, setSelTeacher] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getDepartments().then(r => { setDepartments(r.data); if (r.data.length) setSelDept(r.data[0].id); });
    api.getTeachers().then(r => { setTeachers(r.data); if (r.data.length) setSelTeacher(r.data[0].id); });
  }, []);

  const load = () => {
    setLoading(true);
    const promise = mode === 'dept'
      ? api.getTimetable(selDept, selYear)
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
  }, [mode, selDept, selYear, selTeacher]);

  const dept = departments.find(d => d.id === selDept);
  const years = dept ? Array.from({ length: dept.years || 4 }, (_, i) => i + 1) : [];

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
              <label>Year</label>
              <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
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
      ) : entries.length > 0 ? (
        <TimetableGrid entries={entries} />
      ) : (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🔍</span>
          <p>No timetable data available.</p>
        </div>
      )}
    </div>
  );
}
