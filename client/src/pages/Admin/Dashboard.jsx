import React, { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from '../../components/UI';

export default function Dashboard() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [generating, setGenerating] = useState('');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const PAGE_SIZE = 6;

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    api.getDepartments().then(r => setDepartments(r.data)).catch(() => toast('Failed to load departments', 'error'));
  }, []);

  const handleGenerate = async (deptId) => {
    setGenerating(deptId);
    try {
      const results = [];
      for (let y = 1; y <= 4; y++) {
        const r = await api.generateTimetable(deptId, y, 'week');
        results.push(r.data);
      }
      const total = results.reduce((s, r) => s + (r.placed || 0), 0);
      const errors = results.flatMap(r => r.errors || []);
      toast(`Timetable generated — ${total} slots placed`, 'success');
      if (errors.length > 0) errors.forEach(e => toast(e, 'error'));
    } catch {
      toast('Generation failed', 'error');
    }
    setGenerating('');
  };

  const deptName = (id) => departments.find(d => d.id === id)?.name || '';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Generate Timetable</h1>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍  Search departments by name or code..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          style={{
            width: '100%', padding: '12px 18px', border: '2px solid var(--border)',
            borderRadius: 'var(--radius)', fontSize: 14, outline: 'none',
            background: 'var(--card)', fontFamily: 'inherit', transition: 'border-color .15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Department buttons — paginated, max 6 visible */}
      <div className="dept-bar-wrapper">
        {page > 0 && (
          <button className="dept-bar-arrow left" onClick={() => setPage(p => p - 1)} title="Previous">
            ‹
          </button>
        )}
        <div className="dept-bar">
          {filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map(d => {
            const isActive = selectedDept === d.id;
            const initials = d.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <button
                key={d.id}
                className={`dept-bar-btn${isActive ? ' active' : ''}`}
                onClick={() => setSelectedDept(isActive ? null : d.id)}
              >
                <span className="dept-bar-avatar">{initials}</span>
                <span className="dept-bar-name">{d.name}</span>
                <span className="dept-bar-code">{d.code}</span>
              </button>
            );
          })}
        </div>
        {(page + 1) * PAGE_SIZE < filtered.length && (
          <button className="dept-bar-arrow right" onClick={() => setPage(p => p + 1)} title="Next">
            ›
          </button>
        )}
      </div>
      {filtered.length > PAGE_SIZE && (
        <div className="dept-bar-dots">
          {Array.from({ length: Math.ceil(filtered.length / PAGE_SIZE) }).map((_, i) => (
            <span key={i} className={`dept-bar-dot${i === page ? ' active' : ''}`} onClick={() => setPage(i)} />
          ))}
        </div>
      )}
      {filtered.length === 0 && departments.length > 0 && (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
          No departments match "{search}"
        </div>
      )}

      {departments.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
          No departments found. Add departments first.
        </div>
      )}

      {/* Selected department panel */}
      {selectedDept && (
        <div style={{ marginTop: 24 }}>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
              {deptName(selectedDept)} <span className="badge badge-primary">{departments.find(d => d.id === selectedDept)?.code}</span>
            </h2>
            <button
              className="btn btn-primary"
              onClick={() => handleGenerate(selectedDept)}
              disabled={generating === selectedDept}
            >
              {generating === selectedDept ? '⏳ Generating…' : '+ Generate All Years'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4].map(y => (
              <YearCard key={y} deptId={selectedDept} year={y} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function YearCard({ deptId, year }) {
  const [courses, setCourses] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    api.getCourses(deptId, year).then(r => setCourses(r.data)).catch(() => {});
    api.getTimetable(deptId, year).then(r => setTimetable(r.data)).catch(() => setTimetable([]));
  };

  useEffect(() => { load(); }, [deptId, year]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await api.generateTimetable(deptId, +year, 'week');
      toast(`Year ${year} — ${r.data.placed} slots placed`, 'success');
      if (r.data.errors?.length > 0) r.data.errors.forEach(e => toast(e, 'error'));
      load();
    } catch {
      toast('Generation failed', 'error');
    }
    setGenerating(false);
  };

  const handleClear = async () => {
    if (!window.confirm(`Delete timetable for Year ${year}?`)) return;
    try {
      await api.deleteDeptYearTT(deptId, +year);
      setTimetable([]);
      toast('Cleared', 'success');
    } catch {
      toast('Failed to clear', 'error');
    }
  };

  const scheduled = courses.filter(c => timetable.some(e => e.courseId === c.id)).length;

  return (
    <div style={{
      flex: '1 1 220px', background: 'var(--card)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', padding: 20, boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Year {year}</h3>
        <span className={`badge ${timetable.length > 0 ? 'badge-success' : 'badge-warning'}`}>
          {timetable.length > 0 ? `${timetable.length} slots` : 'No schedule'}
        </span>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
        <div>{courses.length} courses</div>
        <div>{scheduled}/{courses.length} scheduled</div>
      </div>

      <div className="btn-group">
        <button className="btn btn-sm btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? '⏳' : '+ Generate'}
        </button>
        {timetable.length > 0 && (
          <button className="btn btn-sm btn-danger" onClick={handleClear}>Delete</button>
        )}
      </div>
    </div>
  );
}
