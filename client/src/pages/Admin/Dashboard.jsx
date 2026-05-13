import React, { useEffect, useState } from 'react';
import api from '../../api';
import { toast, Modal, useConfirm } from '../../components/UI';

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

  const handleGenerate = async (deptId, semesterGroup) => {
    const dept = departments.find(d => d.id === deptId);
    const maxSem = (dept?.years || 4) * 2;
    const semesters = Array.from({ length: maxSem }, (_, i) => i + 1).filter(s =>
      semesterGroup === 'odd' ? s % 2 !== 0 : s % 2 === 0
    );

    setGenerating(`${deptId}:${semesterGroup}`);
    try {
      const results = [];
      for (const s of semesters) {
        const r = await api.generateTimetable(deptId, s, 'week');
        results.push(r.data);
      }
      const total = results.reduce((s, r) => s + (r.placed || 0), 0);
      const errors = results.flatMap(r => r.errors || []);
      const label = semesterGroup === 'odd' ? 'Odd semesters' : 'Even semesters';
      toast(`${label} generated — ${total} slots placed`, 'success');
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
          placeholder="Search departments by name or code..."
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
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleGenerate(selectedDept, 'odd')}
                disabled={generating.startsWith(`${selectedDept}:`)}
              >
                {generating === `${selectedDept}:odd` ? '⏳ Generating Odd…' : '+ Generate 1,3,5,7'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleGenerate(selectedDept, 'even')}
                disabled={generating.startsWith(`${selectedDept}:`)}
              >
                {generating === `${selectedDept}:even` ? '⏳ Generating Even…' : '+ Generate 2,4,6,8'}
              </button>
            </div>
          </div>

          {Array.from({ length: departments.find(d => d.id === selectedDept)?.years || 4 }, (_, i) => i + 1).map(year => (
            <div key={year} style={{
              marginBottom: 20, background: 'var(--card)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', padding: 20, boxShadow: 'var(--shadow)',
            }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>
                📅 Year {year}
              </h3>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <SemesterCard deptId={selectedDept} semester={year * 2 - 1} />
                <SemesterCard deptId={selectedDept} semester={year * 2} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SemesterCard({ deptId, semester }) {
  const [courses, setCourses] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [generationPrefs, setGenerationPrefs] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [days, setDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  const [slots, setSlots] = useState([]);
  const [confirm, ConfirmDialog] = useConfirm();

  const load = () => {
    api.getCourses(deptId).then(r => setCourses(r.data.filter(c => c.semester === semester))).catch(() => {});
    api.getTimetable(deptId, semester).then(r => setTimetable(r.data)).catch(() => setTimetable([]));
    api.getBatches(deptId, Math.ceil(semester / 2)).then(r => setBatches(r.data || [])).catch(() => setBatches([]));
  };

  useEffect(() => {
    load();
    api.getTeachers(deptId).then(r => setTeachers(r.data || [])).catch(() => {});
    api.getClassrooms().then(r => setClassrooms(r.data || [])).catch(() => {});
    api.getDays().then(r => setDays(r.data || [])).catch(() => {});
    api.getTimeSlots().then(r => setSlots(r.data || [])).catch(() => {});
  }, [deptId, semester]);

  useEffect(() => {
    if (selectedBatchId && !batches.find(b => b.id === selectedBatchId)) {
      setSelectedBatchId('');
    }
  }, [batches, selectedBatchId]);

  const displayTT = selectedBatchId ? timetable.filter(e => e.batchId === selectedBatchId || !e.batchId) : timetable;
  const scheduled = courses.filter(c => displayTT.some(e => e.courseId === c.id)).length;

  const runGenerate = async (preferences = []) => {
    setGenerating(true);
    try {
      const opts = preferences.length > 0 ? { preferences } : undefined;
      const r = await api.generateTimetable(deptId, +semester, 'week', selectedBatchId || null, opts);
      const batchLabel = selectedBatchId ? ` (batch ${batches.find(b => b.id === selectedBatchId)?.section || '?'})` : '';
      toast(`Semester ${semester}${batchLabel} - ${r.data.placed || 0} slots placed`, 'success');
      if (r.data.errors?.length > 0) r.data.errors.forEach(e => toast(e, 'warning'));
      load();
    } catch {
      toast('Generation failed', 'error');
    }
    setGenerating(false);
  };

  const handleGenerate = async () => {
    await runGenerate();
  };

  const addPref = () => {
    setGenerationPrefs(prev => ([
      ...prev,
      {
        id: `pref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        teacherId: '',
        courseId: '',
        dayMode: 'single',
        day: days[0] || 'Monday',
        days: [days[0] || 'Monday'],
        slotId: slots[0]?.id || 1,
        classroomId: '',
        batchId: selectedBatchId || '',
        type: '',
      },
    ]));
  };

  const updatePref = (id, key, value) => {
    setGenerationPrefs(prev => prev.map(p => (p.id === id ? { ...p, [key]: value } : p)));
  };

  const removePref = (id) => {
    setGenerationPrefs(prev => prev.filter(p => p.id !== id));
  };

  const handleGenerateWithPreferences = async () => {
    const invalid = generationPrefs.find(p => {
      if (!p.teacherId || !p.courseId || !p.slotId) return true;
      if (p.dayMode === 'single') return !p.day;
      if (p.dayMode === 'multiple') return !Array.isArray(p.days) || p.days.length === 0;
      return false;
    });
    if (invalid) {
      toast('Please complete all fields in each preference row', 'error');
      return;
    }
    setShowPrefModal(false);
    const preferences = generationPrefs.map(p => ({
      dayMode: p.dayMode || 'single',
      teacherId: p.teacherId,
      courseId: p.courseId,
      day: p.day,
      days:
        p.dayMode === 'all'
          ? [...days]
          : p.dayMode === 'weekdays'
            ? days.filter(d => d !== 'Saturday')
            : p.dayMode === 'multiple'
              ? (p.days || [])
              : [p.day],
      slotId: Number(p.slotId),
      classroomId: p.classroomId || null,
      batchId: p.batchId || null,
      type: p.type || null,
    }));
    await runGenerate(preferences);
  };

  const handleClear = async () => {
    if (!await confirm('Delete Timetable', `Are you sure you want to delete the timetable for Semester ${semester}? This action cannot be undone.`)) return;
    try {
      await api.deleteDeptSemTT(deptId, +semester);
      setTimetable([]);
      toast('Cleared', 'success');
    } catch {
      toast('Failed to clear', 'error');
    }
  };

  return (
    <div style={{
      flex: '1 1 220px', background: 'var(--card)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', padding: 20, boxShadow: 'var(--shadow)',
    }}>
      <ConfirmDialog />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Semester {semester}</h3>
        <span className={`badge ${displayTT.length > 0 ? 'badge-success' : 'badge-warning'}`}>
          {displayTT.length > 0 ? `${displayTT.length} slots` : 'No schedule'}
        </span>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
        <div>{courses.length} courses</div>
        <div>{scheduled}/{courses.length} scheduled</div>
        {batches.length > 0 && (
          <div style={{ marginTop: 4, color: 'var(--primary)', fontWeight: 500 }}>
            👥 {batches.length} batch{batches.length !== 1 ? 'es' : ''}: {batches.map(b => `${b.section}(${b.studentCount})`).join(', ')}
          </div>
        )}
      </div>

      {batches.length > 0 && (
        <div className="form-group" style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12 }}>Batch while generating</label>
          <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.section})</option>)}
          </select>
        </div>
      )}

      <div className="btn-group" style={{ flexWrap: 'wrap' }}>
        <button className="btn btn-sm btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? '⏳' : '+ Generate'}
        </button>
        <button className="btn btn-sm btn-secondary" onClick={() => setShowPrefModal(true)} disabled={generating}>
          ⚙ Generate + Pref
        </button>
        {timetable.length > 0 && (
          <button className="btn btn-sm btn-danger" onClick={handleClear}>Delete</button>
        )}
      </div>

      <Modal title={`Semester ${semester} - Advanced Generation Preferences`} open={showPrefModal} onClose={() => setShowPrefModal(false)}>
        <div className="form">
          <div style={{
            background: '#eff6ff', borderRadius: 8, padding: '12px 16px', fontSize: 13,
            color: '#1e40af', marginBottom: 14
          }}>
            Add optional constraints before generating. You can lock a teacher-course to a fixed room and slot for single day, selected days, weekdays, or full week across semester scheduling.
          </div>

          {generationPrefs.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
              No constraints added.
            </div>
          )}

          {generationPrefs.map((pref, idx) => {
            const teacherFilteredCourses = courses.filter(c => !pref.teacherId || c.teacherId === pref.teacherId);
            return (
              <div key={pref.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 10, background: '#fcfdff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ fontSize: 13 }}>Constraint {idx + 1}</strong>
                  <button className="btn btn-sm btn-danger" onClick={() => removePref(pref.id)}>Remove</button>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Teacher</label>
                    <select value={pref.teacherId} onChange={e => updatePref(pref.id, 'teacherId', e.target.value)}>
                      <option value="">Select Teacher</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Course</label>
                    <select value={pref.courseId} onChange={e => updatePref(pref.id, 'courseId', e.target.value)}>
                      <option value="">Select Course</option>
                      {teacherFilteredCourses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Day Option</label>
                    <select value={pref.dayMode || 'single'} onChange={e => updatePref(pref.id, 'dayMode', e.target.value)}>
                      <option value="single">Single Day</option>
                      <option value="multiple">Select Multiple Days</option>
                      <option value="weekdays">All Weekdays (Mon-Fri)</option>
                      <option value="all">Full Week (Mon-Sat)</option>
                    </select>
                  </div>

                  {(pref.dayMode || 'single') === 'single' && (
                    <div className="form-group">
                      <label>Day</label>
                      <select value={pref.day} onChange={e => {
                        updatePref(pref.id, 'day', e.target.value);
                        updatePref(pref.id, 'days', [e.target.value]);
                      }}>
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Time Slot</label>
                    <select value={pref.slotId} onChange={e => updatePref(pref.id, 'slotId', Number(e.target.value))}>
                      {slots.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                {(pref.dayMode || 'single') === 'multiple' && (
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label>Select Days</label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {days.map(d => {
                        const selected = (pref.days || []).includes(d);
                        return (
                          <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => {
                                const current = pref.days || [];
                                const next = selected ? current.filter(x => x !== d) : [...current, d];
                                updatePref(pref.id, 'days', next);
                              }}
                            />
                            {d.slice(0, 3)}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{
                  marginBottom: 10,
                  padding: '8px 10px',
                  background: '#f8fafc',
                  border: '1px dashed var(--border)',
                  borderRadius: 6,
                  fontSize: 12,
                  color: 'var(--text-secondary)'
                }}>
                  <strong>Applies:</strong>{' '}
                  {(pref.dayMode || 'single') === 'single'
                    ? pref.day
                    : (pref.dayMode === 'weekdays'
                      ? 'Mon-Fri'
                      : (pref.dayMode === 'all'
                        ? 'Mon-Sat'
                        : (pref.days || []).join(', ') || 'No days selected'))}
                  {' '}at{' '}
                  {slots.find(s => Number(s.id) === Number(pref.slotId))?.label || `Slot ${pref.slotId}`}
                  {pref.classroomId
                    ? ` in ${classrooms.find(r => r.id === pref.classroomId)?.name || pref.classroomId}`
                    : ' in any room'}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Room (optional)</label>
                    <select value={pref.classroomId} onChange={e => updatePref(pref.id, 'classroomId', e.target.value)}>
                      <option value="">Any Room</option>
                      {classrooms
                        .filter(r => !pref.type || r.type === pref.type)
                        .map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                    </select>
                  </div>

                  {batches.length > 0 && (
                    <div className="form-group">
                      <label>Batch (optional)</label>
                      <select value={pref.batchId} onChange={e => updatePref(pref.id, 'batchId', e.target.value)}>
                        <option value="">Any Batch</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.section})</option>)}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Type (optional)</label>
                    <select value={pref.type} onChange={e => updatePref(pref.id, 'type', e.target.value)}>
                      <option value="">Any</option>
                      <option value="lecture">Lecture</option>
                      <option value="lab">Lab</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={addPref}>+ Add Constraint</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowPrefModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGenerateWithPreferences}>Generate</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
