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
  const [coverageWarning, setCoverageWarning] = useState('');
  const [selBatch, setSelBatch] = useState('');
  const [deptBatches, setDeptBatches] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [pendingBatchId, setPendingBatchId] = useState(null);
  const [generationPrefs, setGenerationPrefs] = useState([]);
  const [days, setDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  const [slots, setSlots] = useState([]);
  const [conflictsCache, setConflictsCache] = useState({});  // keyed by prefId

  /* edit modal */
  const [editing, setEditing] = useState(null);
  const [editIssue, setEditIssue] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [confirm, ConfirmDialog] = useConfirm();

  useEffect(() => {
    api.getDepartments().then(r => { setDepartments(r.data); if (r.data.length) setSelDept(r.data[0].id); });
    api.getTeachers().then(r => setTeachers(r.data));
    api.getClassrooms().then(r => setClassrooms(r.data));
    api.getCourses().then(r => setCourses(r.data));
    api.getDays().then(r => setDays(r.data || [])).catch(() => {});
    api.getTimeSlots().then(r => setSlots(r.data || [])).catch(() => {});
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

  const openGenerateModal = (specificBatchId = null) => {
    if (!selDept) return;
    setPendingBatchId(specificBatchId || null);
    setShowGenerateModal(true);
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
        batchId: '',
        type: '',
      },
    ]));
  };

  const updatePref = (id, key, value) => {
    setGenerationPrefs(prev => prev.map(p => (p.id === id ? { ...p, [key]: value } : p)));
  };

  const removePref = (id) => {
    setGenerationPrefs(prev => prev.filter(p => p.id !== id));
    setConflictsCache(prev => { const next = { ...prev }; delete next[id]; return next; });
  };

  // Fetch conflicts for a preference row when teacher/batch changes
  const fetchConflictsForPref = async (prefId, teacherId, batchId) => {
    if (!teacherId && !batchId) {
      setConflictsCache(prev => { const next = { ...prev }; delete next[prefId]; return next; });
      return;
    }
    try {
      const r = await api.getConflicts(selDept, selSem, teacherId || null, batchId || null);
      setConflictsCache(prev => ({ ...prev, [prefId]: r.data }));
    } catch {
      // silently ignore
    }
  };

  // Helper: check if a day+slot is conflicting for a pref
  const getSlotConflict = (prefId, day, slotId) => {
    const c = conflictsCache[prefId];
    if (!c) return null;
    const teacherHit = (c.teacherConflicts || []).find(x => x.day === day && x.slotId === Number(slotId));
    const batchHit = (c.batchConflicts || []).find(x => x.day === day && x.slotId === Number(slotId));
    if (teacherHit && batchHit) return { type: 'both', teacher: teacherHit, batch: batchHit };
    if (teacherHit) return { type: 'teacher', teacher: teacherHit };
    if (batchHit) return { type: 'batch', batch: batchHit };
    return null;
  };

  const generate = async () => {
    if (!selDept) return;
    const targetBatchId = pendingBatchId || selBatch || null;
    const batchLabel = targetBatchId
      ? ` for Batch ${semBatches.find(b => b.id === targetBatchId)?.section || '?'}`
      : semBatches.length > 0 ? ' for all batches' : '';

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

    setShowGenerateModal(false);

    if (!await confirm('Generate Timetable', `This will regenerate the timetable for semester ${selSem}${batchLabel}. Continue?`)) return;
    setLoading(true);
    try {
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

      const r = await api.generateTimetable(selDept, selSem, 'week', targetBatchId, { preferences });
      setTimetable(r.data.schedule || r.data);
      toast(`Timetable generated! ${r.data.placed || 0} entries placed${r.data.batches ? ` (${r.data.batches} batches)` : ''}.`, 'success');
      if (r.data.errors && r.data.errors.length > 0) {
        r.data.errors.forEach(err => toast(err, 'warning'));
      }
      if (!targetBatchId && semBatches.length > 0 && r.data.batches && r.data.batches < semBatches.length) {
        toast(`Warning: only ${r.data.batches} of ${semBatches.length} batches received active entries for this semester.`, 'warning');
      }
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Generation failed', 'error');
    }
    setLoading(false);
  };

  /* edit entry */
  const handleEntryClick = (entry) => {
    setEditIssue('');
    setEditing({ ...entry });
  };

  const editConflictReason = React.useMemo(() => {
    if (!editing || !timetable) return '';

    const sameSlot = timetable.filter(e =>
      e.id !== editing.id &&
      e.status !== 'cancelled' &&
      e.status !== 'temp_cancelled' &&
      e.day === editing.day &&
      Number(e.slotId) === Number(editing.slotId)
    );

    if (editing.classroomId && sameSlot.some(e => e.classroomId === editing.classroomId)) {
      return 'Selected classroom is already occupied at this day/slot.';
    }

    if (editing.teacherId && sameSlot.some(e => e.teacherId === editing.teacherId)) {
      return 'Selected teacher already has a class at this day/slot.';
    }

    if (editing.batchId) {
      const batchConflict = sameSlot.some(e =>
        e.departmentId === editing.departmentId &&
        Number(e.semester) === Number(editing.semester) &&
        e.batchId === editing.batchId
      );
      if (batchConflict) {
        return 'Selected batch already has another class at this day/slot.';
      }
    }

    return '';
  }, [editing, timetable]);

  const saveEntry = async () => {
    if (editConflictReason) {
      setEditIssue(editConflictReason);
      toast(editConflictReason, 'warning');
      return;
    }

    try {
      await api.updateEntry(editing.id, editing);
      toast('Entry updated', 'success');
      setEditIssue('');
      setEditing(null);
      load();
    } catch (e) {
      const msg = e.response?.data?.error || 'Update failed';
      setEditIssue(msg);
      toast(msg, 'error');
    }
  };

  const cancelEntryForWeek = async () => {
    if (!editing) return;
    if (editing.status === 'temp_cancelled') {
      toast('This lecture is already cancelled for this week', 'info');
      return;
    }
    if (editing.status === 'cancelled') {
      toast('This lecture is permanently cancelled', 'warning');
      return;
    }

    if (!await confirm('Cancel Lecture (This Week)', 'Cancel this lecture for the current week only?')) return;
    try {
      await api.cancelTempLecture(editing.id);
      toast('Lecture cancelled for this week', 'success');
      setEditing(null);
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Weekly cancellation failed', 'error');
    }
  };

  const restoreEntry = async () => {
    if (!editing) return;
    if (editing.status !== 'cancelled' && editing.status !== 'temp_cancelled') {
      toast('This lecture is already active', 'info');
      return;
    }

    if (!await confirm('Restore Lecture', 'Restore this cancelled lecture to active status?')) return;
    try {
      await api.restoreLecture(editing.id);
      toast('Lecture restored', 'success');
      setEditing(null);
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Restore failed', 'error');
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

  const activeTimetable = React.useMemo(() => {
    if (!timetable) return [];
    return timetable.filter(e => e.status !== 'cancelled' && e.status !== 'temp_cancelled');
  }, [timetable]);

  const batchCoverage = React.useMemo(() => {
    const counts = new Map();
    activeTimetable.forEach(entry => {
      if (!entry.batchId) return;
      counts.set(entry.batchId, (counts.get(entry.batchId) || 0) + 1);
    });
    return counts;
  }, [activeTimetable]);

  const missingBatches = React.useMemo(() => {
    return semBatches.filter(batch => (batchCoverage.get(batch.id) || 0) === 0);
  }, [semBatches, batchCoverage]);

  React.useEffect(() => {
    if (!selDept || !selSem || loading || !timetable) {
      setCoverageWarning('');
      return;
    }

    if (missingBatches.length > 0) {
      const batchNames = missingBatches.map(b => `Section ${b.section}`).join(', ');
      setCoverageWarning(`No active timetable entries were found for ${batchNames} in Year ${Math.ceil(selSem / 2)} Semester ${selSem}.`);
    } else {
      setCoverageWarning('');
    }
  }, [selDept, selSem, timetable, loading, missingBatches]);

  // Filter timetable by selected batch
  const displayedEntries = React.useMemo(() => {
    if (!timetable) return [];
    return ttBatches.length === 0
      ? timetable
      : (!selBatch ? timetable.filter(e => !e.batchId) : timetable.filter(e => e.batchId === selBatch || !e.batchId));
  }, [timetable, selBatch, ttBatches]);

  // Auto-select first batch when timetable loads
  React.useEffect(() => {
    if (ttBatches.length > 0 && !ttBatches.find(b => b.id === selBatch)) {
      setSelBatch(ttBatches[0].id);
    } else if (ttBatches.length === 0) {
      setSelBatch('');
    }
  }, [ttBatches]);

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
            <button className="btn btn-primary" onClick={() => openGenerateModal()} disabled={loading}>
              {loading ? 'Working…' : (selBatch ? '⚡ Generate Selected Batch' : (semBatches.length > 0 ? '⚡ Generate All Batches' : '⚡ Generate'))}
            </button>
          </div>
          {/* {semBatches.length > 0 && (
            // <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            //   <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Generate batch:</span>
            //   {semBatches.map(b => (
            //     <button
            //       key={b.id}
            //       className="btn btn-sm btn-secondary"
            //       onClick={() => openGenerateModal(b.id)}
            //       disabled={loading}
            //       style={{ fontSize: 11, padding: '4px 10px' }}
            //     >
            //       👥 {b.name} ({b.section}) — {b.studentCount} students
            //     </button>
            //   ))}
            // </div>
          )} */}
          {semBatches.length > 0 && (
            <div style={{
              fontSize: 11, color: 'var(--primary)', background: '#eff6ff',
              padding: '4px 10px', borderRadius: 6, fontWeight: 500
            }}>
              ℹ️ {selBatch
                ? `Showing full timetable for section (${semBatches.find(b => b.id === selBatch)?.section || selBatch}) for Year ${Math.ceil(selSem / 2)} including its elective subjects`
                : `${semBatches.length} batch${semBatches.length !== 1 ? 'es' : ''} found for Year ${Math.ceil(selSem / 2)} — select a batch in "View Batch" to see that batch's full timetable, including electives`}
            </div>
          )}
        </div>
      </div>

      {coverageWarning && (
        <div style={{
          margin: '0 0 14px',
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid #f59e0b',
          background: '#fffbeb',
          color: '#92400e',
          fontSize: 13,
          fontWeight: 600,
        }}>
          ⚠️ {coverageWarning}
        </div>
      )}

      {loading && <div className="loading">Loading…</div>}

      {!loading && timetable && timetable.length > 0 && (
        <TimetableGrid entries={displayedEntries} onCellClick={handleEntryClick} />
      )}
      {!loading && timetable && displayedEntries.length === 0 && (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📅</span>
          <p>
            {timetable.length === 0
              ? 'No timetable generated yet for this department/semester.'
              : selBatch && missingBatches.some(b => b.id === selBatch)
                ? 'This batch currently has no active timetable entries. Generate the semester again or select another batch.'
                : 'No entries match the current view filters.'}
          </p>
          <button className="btn btn-primary" onClick={() => openGenerateModal()}>Generate Now</button>
        </div>
      )}

      <Modal title="Advanced Generation Preferences" open={showGenerateModal} onClose={() => setShowGenerateModal(false)}>
        <div className="form">
          <div style={{
            background: '#eff6ff', borderRadius: 8, padding: '12px 16px', fontSize: 13,
            color: '#1e40af', marginBottom: 14
          }}>
            Add optional constraints before generating. You can lock a teacher-course to a fixed room and slot for single day, selected days, weekdays, or full week across semester scheduling.
          </div>

          {generationPrefs.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
              No constraints added. Generation will use default smart scheduling.
            </div>
          )}

          {generationPrefs.map((pref, idx) => {
            const teacherFilteredCourses = courses.filter(c => {
              const cDepts = c.departmentIds || (c.departmentId ? [c.departmentId] : []);
              if (!cDepts.includes(selDept) || c.semester !== selSem) return false;
              if (!pref.teacherId) return true;
              return c.teacherId === pref.teacherId;
            });

            return (
              <div key={pref.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 10, background: '#fcfdff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ fontSize: 13 }}>Constraint {idx + 1}</strong>
                  <button className="btn btn-sm btn-danger" onClick={() => removePref(pref.id)}>Remove</button>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Teacher</label>
                    <select value={pref.teacherId} onChange={e => {
                      updatePref(pref.id, 'teacherId', e.target.value);
                      fetchConflictsForPref(pref.id, e.target.value, pref.batchId);
                    }}>
                      <option value="">Select Teacher</option>
                      {teachers.filter(t => {
                        const tDepts = t.departmentIds || (t.departmentId ? [t.departmentId] : []);
                        return tDepts.includes(selDept);
                      }).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Course</label>
                    <select value={pref.courseId} onChange={e => updatePref(pref.id, 'courseId', e.target.value)}>
                      <option value="">Select Course</option>
                      {teacherFilteredCourses.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                      ))}
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
                      <select
                        value={pref.day}
                        onChange={e => {
                          updatePref(pref.id, 'day', e.target.value);
                          updatePref(pref.id, 'days', [e.target.value]);
                        }}
                        style={{
                          ...(getSlotConflict(pref.id, pref.day, pref.slotId)
                            ? { borderColor: getSlotConflict(pref.id, pref.day, pref.slotId).type === 'teacher' || getSlotConflict(pref.id, pref.day, pref.slotId).type === 'both' ? '#ef4444' : '#f59e0b', borderWidth: 2 }
                            : {}),
                        }}
                      >
                        {days.map(d => {
                          const conflict = getSlotConflict(pref.id, d, pref.slotId);
                          return (
                            <option key={d} value={d}>
                              {d}{conflict ? (conflict.type === 'teacher' || conflict.type === 'both' ? ' 🔴' : ' 🟡') : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Time Slot</label>
                    <select
                      value={pref.slotId}
                      onChange={e => updatePref(pref.id, 'slotId', Number(e.target.value))}
                      style={{
                        ...((pref.dayMode || 'single') === 'single' && getSlotConflict(pref.id, pref.day, pref.slotId)
                          ? { borderColor: getSlotConflict(pref.id, pref.day, pref.slotId).type === 'teacher' || getSlotConflict(pref.id, pref.day, pref.slotId).type === 'both' ? '#ef4444' : '#f59e0b', borderWidth: 2 }
                          : {}),
                      }}
                    >
                      {slots.map(s => {
                        // For single-day mode, show conflict per slot
                        const selectedDay = (pref.dayMode || 'single') === 'single' ? pref.day : null;
                        const conflict = selectedDay ? getSlotConflict(pref.id, selectedDay, s.id) : null;
                        return (
                          <option key={s.id} value={s.id}>
                            {s.label}{conflict ? (conflict.type === 'teacher' || conflict.type === 'both' ? ' 🔴 Teacher busy' : ' 🟡 Batch busy') : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {(pref.dayMode || 'single') === 'multiple' && (
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label>Select Days</label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {days.map(d => {
                        const selected = (pref.days || []).includes(d);
                        const conflict = getSlotConflict(pref.id, d, pref.slotId);
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
                            {conflict && (
                              <span title={conflict.type === 'teacher' || conflict.type === 'both' ? `Teacher busy: ${conflict.teacher?.courseName || ''}` : `Batch busy: ${conflict.batch?.courseName || ''}`} style={{ cursor: 'help' }}>
                                {conflict.type === 'teacher' || conflict.type === 'both' ? '🔴' : '🟡'}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Conflict summary for current selection */}
                {(() => {
                  const currentConflict = (pref.dayMode || 'single') === 'single'
                    ? getSlotConflict(pref.id, pref.day, pref.slotId)
                    : null;
                  if (!currentConflict) return null;
                  return (
                    <div style={{
                      padding: '6px 10px', borderRadius: 6, fontSize: 12, marginBottom: 8,
                      background: currentConflict.type === 'teacher' || currentConflict.type === 'both' ? '#fef2f2' : '#fffbeb',
                      border: `1px solid ${currentConflict.type === 'teacher' || currentConflict.type === 'both' ? '#fca5a5' : '#fcd34d'}`,
                      color: currentConflict.type === 'teacher' || currentConflict.type === 'both' ? '#991b1b' : '#92400e',
                    }}>
                      {currentConflict.type === 'teacher' || currentConflict.type === 'both'
                        ? `⚠️ Teacher already teaches "${currentConflict.teacher.courseName || ''}" (${currentConflict.teacher.courseCode || ''}) at this slot${currentConflict.teacher.classroomName ? ` in ${currentConflict.teacher.classroomName}` : ''}`
                        : `⚠️ Batch already has "${currentConflict.batch.courseName || ''}" (${currentConflict.batch.courseCode || ''}) at this slot`}
                      {currentConflict.type === 'both' && (
                        <div style={{ marginTop: 2 }}>
                          Also: Batch has "{currentConflict.batch.courseName || ''}" ({currentConflict.batch.courseCode || ''}) at this slot
                        </div>
                      )}
                      <div style={{ marginTop: 4, fontStyle: 'italic', opacity: 0.8 }}>
                        The scheduler will attempt your preference but may place this class in a different slot to avoid conflicts.
                      </div>
                    </div>
                  );
                })()}

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

                  {semBatches.length > 0 && (
                    <div className="form-group">
                      <label>Batch (optional)</label>
                      <select value={pref.batchId} onChange={e => {
                        updatePref(pref.id, 'batchId', e.target.value);
                        fetchConflictsForPref(pref.id, pref.teacherId, e.target.value);
                      }}>
                        <option value="">Any Batch</option>
                        {semBatches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.section})</option>)}
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
              <button className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={generate}>Generate Timetable</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal title="Edit Timetable Entry" open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <div className="form">
            <div className="form-group">
              <label>Course</label>
              <select value={editing.courseId || ''} onChange={e => {
                const c = courses.find(x => x.id === e.target.value);
                setEditIssue('');
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
                setEditIssue('');
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
                setEditIssue('');
                setEditing({ ...editing, classroomId: e.target.value, classroomName: r?.name || '' });
              }}>
                <option value="">Select</option>
                {classrooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Day</label>
                <select value={editing.day || ''} onChange={e => {
                  setEditIssue('');
                  setEditing({ ...editing, day: e.target.value });
                }}>
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Slot</label>
                <select value={editing.slotId || ''} onChange={e => {
                  const nextSlotId = Number(e.target.value);
                  const slot = slots.find(s => Number(s.id) === nextSlotId);
                  setEditIssue('');
                  setEditing({
                    ...editing,
                    slotId: nextSlotId,
                    slotLabel: slot?.label || editing.slotLabel,
                    startTime: slot?.start || editing.startTime,
                    endTime: slot?.end || editing.endTime,
                  });
                }}>
                  {slots.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={editing.type || 'lecture'} onChange={e => {
                setEditIssue('');
                setEditing({ ...editing, type: e.target.value });
              }}>
                <option value="lecture">Lecture</option>
                <option value="lab">Lab</option>
              </select>
            </div>

            {(editConflictReason || editIssue) && (
              <div style={{
                marginTop: 4,
                marginBottom: 8,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #fca5a5',
                background: '#fef2f2',
                color: '#991b1b',
                fontSize: 12,
                fontWeight: 600,
              }}>
                Change not possible: {editConflictReason || editIssue}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-danger" onClick={deleteEntry}>Delete</button>
              <button
                className="btn btn-secondary"
                onClick={cancelEntryForWeek}
                disabled={editing.status === 'temp_cancelled' || editing.status === 'cancelled'}
                title={editing.status === 'cancelled' ? 'Lecture is permanently cancelled' : (editing.status === 'temp_cancelled' ? 'Already cancelled for this week' : 'Cancel this lecture for current week')}
              >
                Cancel This Week
              </button>
              <button
                className="btn btn-secondary"
                onClick={restoreEntry}
                disabled={editing.status !== 'temp_cancelled' && editing.status !== 'cancelled'}
                title={editing.status === 'temp_cancelled' || editing.status === 'cancelled' ? 'Restore this cancelled lecture' : 'Lecture is already active'}
              >
                Restore
              </button>
              <button
                className="btn btn-primary"
                onClick={saveEntry}
                disabled={!!editConflictReason}
                title={editConflictReason || 'Save changes'}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
