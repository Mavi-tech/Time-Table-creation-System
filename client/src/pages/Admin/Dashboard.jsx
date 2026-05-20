import React, { useEffect, useState, useRef } from 'react';
import api from '../../api';
import { toast, Modal, useConfirm } from '../../components/UI';
import { Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [generating, setGenerating] = useState('');
  const [search, setSearch] = useState('');
  const scrollRef = useRef(null);

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
      // Step 1: Delete existing timetables for these semesters first
      for (const s of semesters) {
        try {
          await api.deleteDeptSemTT(deptId, s);
        } catch {
          // Ignore if nothing to delete
        }
      }
      toast('Old timetables cleared, generating new ones...', 'info');

      // Step 2: Generate fresh timetables
      const results = [];
      for (const s of semesters) {
        const r = await api.generateTimetable(deptId, s, 'week');
        results.push(r.data);
      }
      const total = results.reduce((s, r) => s + (r.placed || 0), 0);
      const errors = results.flatMap(r => r.errors || []);
      const label = semesterGroup === 'odd' ? 'Odd semesters (1,3,5,7)' : 'Even semesters (2,4,6,8)';
      toast(`${label} generated — ${total} slots placed`, 'success');
      if (errors.length > 0) errors.forEach(e => toast(e, 'error'));
    } catch {
      toast('Generation failed', 'error');
    }
    setGenerating('');
  };

  const deptName = (id) => departments.find(d => d.id === id)?.name || '';

  return (
    <div className="animate-fade-in relative z-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight">Generate Timetable</h1>
      </div>

      {/* Search bar */}
      <div className="mb-8 relative max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-neutral-400" />
        </div>
        <input
          type="text"
          placeholder="Search departments by name or code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none bg-white shadow-sm font-medium text-neutral-900 placeholder:text-neutral-400"
        />
      </div>

      {/* Department carousel */}
      <div className="relative mb-8 group">
        <button 
          onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white border border-neutral-200 text-neutral-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-50"
        >
          <ChevronLeft size={20} />
        </button>

        <div 
          ref={scrollRef} 
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filtered.map(d => {
            const isActive = selectedDept === d.id;
            const initials = d.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDept(isActive ? null : d.id)}
                className={`flex-none w-[280px] sm:w-[320px] flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 snap-start ${
                  isActive 
                    ? 'bg-primary-50 border-primary-500 shadow-md ring-1 ring-primary-500' 
                    : 'bg-white border-neutral-200 hover:border-primary-300 hover:shadow-sm'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 transition-colors ${
                  isActive ? 'bg-primary-500 text-white shadow-sm' : 'bg-neutral-100 text-neutral-600 group-hover:bg-primary-100 group-hover:text-primary-700'
                }`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold truncate ${isActive ? 'text-primary-900' : 'text-neutral-900'}`}>{d.name}</div>
                  <div className={`text-xs font-semibold mt-0.5 ${isActive ? 'text-primary-600' : 'text-neutral-500'}`}>{d.code}</div>
                </div>
              </button>
            );
          })}
        </div>

        <button 
          onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white border border-neutral-200 text-neutral-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-50"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {filtered.length === 0 && departments.length > 0 && (
        <div className="text-center py-12 text-neutral-500 font-medium">
          No departments match "{search}"
        </div>
      )}

      {departments.length === 0 && (
        <div className="text-center py-12 text-neutral-500 font-medium">
          No departments found. Add departments first.
        </div>
      )}

      {/* Selected department panel */}
      {selectedDept && (
        <div className="mt-8 animate-fade-in border-t border-neutral-200 pt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-extrabold text-neutral-900 flex items-center gap-3">
              {deptName(selectedDept)} 
              <span className="px-2.5 py-1 text-xs font-bold bg-primary-100 text-primary-700 rounded-md uppercase tracking-wider">{departments.find(d => d.id === selectedDept)?.code}</span>
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                className="px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl shadow-sm hover:bg-primary-700 disabled:opacity-70 transition-all flex items-center gap-2"
                onClick={() => handleGenerate(selectedDept, 'odd')}
                disabled={generating.startsWith(`${selectedDept}:`)}
              >
                {generating === `${selectedDept}:odd` ? '⏳ Generating Odd…' : '+ Generate 1,3,5,7'}
              </button>
              <button
                className="px-5 py-2.5 bg-white border border-neutral-200 text-neutral-700 font-bold rounded-xl shadow-sm hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-70 transition-all flex items-center gap-2"
                onClick={() => handleGenerate(selectedDept, 'even')}
                disabled={generating.startsWith(`${selectedDept}:`)}
              >
                {generating === `${selectedDept}:even` ? '⏳ Generating Even…' : '+ Generate 2,4,6,8'}
              </button>
            </div>
          </div>

          {/* Years */}
          <div className="space-y-6">
            {Array.from({ length: departments.find(d => d.id === selectedDept)?.years || 4 }, (_, i) => i + 1).map(year => (
              <div key={year} className="bg-white/60 backdrop-blur-xl rounded-3xl border border-neutral-200 shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2 relative z-10">
                  <span className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600"><Calendar size={16} strokeWidth={2.5} /></span> 
                  Year {year}
                </h3>
                <div className="grid lg:grid-cols-2 gap-6 relative z-10">
                  <SemesterCard deptId={selectedDept} semester={year * 2 - 1} />
                  <SemesterCard deptId={selectedDept} semester={year * 2} />
                </div>
              </div>
            ))}
          </div>
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
    <div className="flex-1 min-w-[220px] bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <ConfirmDialog />
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-neutral-900">Semester {semester}</h3>
        <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${displayTT.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {displayTT.length > 0 ? `${displayTT.length} slots` : 'No schedule'}
        </span>
      </div>

      <div className="text-sm text-neutral-500 mb-4 space-y-1">
        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-neutral-300"></div>{courses.length} courses</div>
        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-neutral-300"></div>{scheduled}/{courses.length} scheduled</div>
        {batches.length > 0 && (
          <div className="mt-3 text-primary-600 font-semibold bg-primary-50 px-3 py-2 rounded-lg border border-primary-100 inline-block">
            👥 {batches.length} batch{batches.length !== 1 ? 'es' : ''}: {batches.map(b => `${b.section}(${b.studentCount})`).join(', ')}
          </div>
        )}
      </div>

      {batches.length > 0 && (
        <div className="mb-4">
          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Batch while generating</label>
          <select 
            value={selectedBatchId} 
            onChange={e => setSelectedBatchId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          >
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.section})</option>)}
          </select>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-neutral-100">
        <button className="px-3 py-1.5 bg-primary-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-primary-700 disabled:opacity-70 transition-all" onClick={handleGenerate} disabled={generating}>
          {generating ? '⏳' : '+ Generate'}
        </button>
        <button className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 disabled:opacity-70 transition-all flex items-center gap-1.5" onClick={() => setShowPrefModal(true)} disabled={generating}>
          ⚙ <span className="hidden sm:inline">Adv.</span> Pref
        </button>
        {timetable.length > 0 && (
          <button className="px-3 py-1.5 bg-red-50 text-red-600 text-sm font-bold rounded-lg hover:bg-red-100 transition-all ml-auto" onClick={handleClear}>Delete</button>
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
