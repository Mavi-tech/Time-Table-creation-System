import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../api';
import { toast, Modal, useConfirm } from '../../components/UI';

const SECTION_COLORS = ['#4f46e5','#0ea5e9','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#06b6d4'];
function getSectionColor(section) {
  const code = (section || 'A').charCodeAt(0);
  return SECTION_COLORS[code % SECTION_COLORS.length];
}

export default function BatchesManager() {
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAutoSplit, setShowAutoSplit] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [errors, setErrors] = useState({});
  const [confirm, ConfirmDialog] = useConfirm();
  const [autoSplit, setAutoSplit] = useState({ departmentId: '', year: 1, totalStudents: 120, maxPerBatch: 60 });

  const blank = { name: '', section: '', departmentId: '', year: 1, studentCount: 60 };

  const load = useCallback(() => {
    api.getBatches().then(r => setBatches(r.data));
  }, []);

  useEffect(() => {
    load();
    api.getDepartments().then(r => setDepartments(r.data));
    api.getClassrooms().then(r => setClassrooms(r.data));
  }, [load]);

  const deptMap = useMemo(() => {
    const m = {};
    departments.forEach(d => { m[d.id] = d; });
    return m;
  }, [departments]);

  const maxClassroomCapacity = useMemo(() => {
    if (classrooms.length === 0) return 60;
    return Math.max(...classrooms.map(c => c.capacity || 0));
  }, [classrooms]);

  const filtered = useMemo(() => {
    let list = batches;
    if (filterDept) list = list.filter(b => b.departmentId === filterDept);
    if (filterYear) list = list.filter(b => b.year === Number(filterYear));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.name?.toLowerCase().includes(q) ||
        b.section?.toLowerCase().includes(q) ||
        (b.departmentName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [batches, search, filterDept, filterYear]);

  // Group batches by dept+year for summary
  const groupedStats = useMemo(() => {
    const groups = {};
    batches.forEach(b => {
      const key = `${b.departmentId}-${b.year}`;
      if (!groups[key]) groups[key] = { departmentId: b.departmentId, year: b.year, batches: 0, totalStudents: 0 };
      groups[key].batches++;
      groups[key].totalStudents += (b.studentCount || 0);
    });
    return Object.values(groups);
  }, [batches]);

  const stats = useMemo(() => ({
    totalBatches: batches.length,
    totalStudents: batches.reduce((s, b) => s + (b.studentCount || 0), 0),
    deptYearGroups: groupedStats.length,
    avgPerBatch: batches.length ? Math.round(batches.reduce((s, b) => s + (b.studentCount || 0), 0) / batches.length) : 0,
  }), [batches, groupedStats]);

  // Check capacity warnings
  const capacityWarnings = useMemo(() => {
    const warnings = [];
    batches.forEach(b => {
      const suitableRooms = classrooms.filter(r => r.type === 'lecture' && (r.capacity || 0) >= (b.studentCount || 0));
      if (suitableRooms.length === 0) {
        warnings.push({ batchId: b.id, message: `${b.name} (${deptMap[b.departmentId]?.code || '?'} Y${b.year}): ${b.studentCount} students exceeds all lecture room capacities!` });
      }
    });
    return warnings;
  }, [batches, classrooms, deptMap]);

  const openAdd = () => { setEditing({ ...blank }); setErrors({}); setShowModal(true); };
  const openEdit = (b) => { setEditing({ ...b }); setErrors({}); setShowModal(true); };
  const close = () => { setEditing(null); setShowModal(false); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!editing.name?.trim()) e.name = 'Batch name is required';
    if (!editing.section?.trim()) e.section = 'Section letter is required';
    if (!editing.departmentId) e.departmentId = 'Department is required';
    const dept = deptMap[editing.departmentId];
    const maxYr = dept?.years || 4;
    if (!editing.year || editing.year < 1 || editing.year > maxYr) e.year = 'Invalid year';
    if (!editing.studentCount || editing.studentCount < 1) e.studentCount = 'Student count must be at least 1';
    // Check duplicate section in same dept+year
    const dup = batches.find(b =>
      b.section?.toLowerCase() === editing.section?.toLowerCase() &&
      b.departmentId === editing.departmentId &&
      b.year === editing.year &&
      b.id !== editing.id
    );
    if (dup) e.section = `Section "${editing.section}" already exists for this dept/year`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    try {
      if (editing.id) {
        await api.updateBatch(editing.id, editing);
        toast('Batch updated', 'success');
      } else {
        await api.createBatch(editing);
        toast('Batch created', 'success');
      }
      close();
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Save failed', 'error');
    }
  };

  const remove = async (id) => {
    const b = batches.find(x => x.id === id);
    if (!await confirm('Delete Batch', `Delete "${b?.name || 'this batch'}"? This may affect timetable generation.`)) return;
    try {
      await api.deleteBatch(id);
      toast('Batch deleted', 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const set = (k, v) => {
    setEditing(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  const handleAutoSplit = async () => {
    if (!autoSplit.departmentId || !autoSplit.year || !autoSplit.totalStudents || !autoSplit.maxPerBatch) {
      toast('Please fill all fields', 'error');
      return;
    }
    try {
      const res = await api.autoSplitBatches(autoSplit);
      toast(`Created ${res.data.numBatches} batches automatically`, 'success');
      setShowAutoSplit(false);
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Auto-split failed', 'error');
    }
  };

  return (
    <div>
      <ConfirmDialog />
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Student Batches</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>
            Divide students into batches to avoid classroom capacity conflicts
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowAutoSplit(true)}>⚡ Auto Split</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Batch</button>
        </div>
      </div>

      {/* Capacity Warnings */}
      {capacityWarnings.length > 0 && (
        <div style={{
          background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, padding: '14px 18px',
          marginBottom: 20, fontSize: 13
        }}>
          <strong style={{ color: '#92400e' }}>⚠️ Capacity Warnings:</strong>
          <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
            {capacityWarnings.map((w, i) => (
              <li key={i} style={{ color: '#92400e', marginBottom: 2 }}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div className="stat-info">
            <h3>{stats.totalBatches}</h3>
            <p>Total Batches</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">🎓</div>
          <div className="stat-info">
            <h3>{stats.totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📊</div>
          <div className="stat-info">
            <h3>{stats.deptYearGroups}</h3>
            <p>Dept/Year Groups</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">📏</div>
          <div className="stat-info">
            <h3>{stats.avgPerBatch}</h3>
            <p>Avg per Batch</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-secondary)' }}>🔍</span>
            <input
              placeholder="Search by batch name, section..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px 10px 36px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit' }}
            />
          </div>
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            style={{ padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit', minWidth: 160 }}
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            style={{ padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit', minWidth: 120 }}
          >
            <option value="">All Years</option>
            {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>
      </div>

      {/* Batch Table */}
      <div className="table-wrapper card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Batch</th>
              <th>Department</th>
              <th>Year</th>
              <th>Students</th>
              <th>Capacity Fit</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => {
              const dept = deptMap[b.departmentId];
              const suitableRooms = classrooms.filter(r => r.type === 'lecture' && (r.capacity || 0) >= (b.studentCount || 0));
              const suitableLabs = classrooms.filter(r => r.type === 'lab' && (r.capacity || 0) >= (b.studentCount || 0));
              const hasWarning = suitableRooms.length === 0;
              return (
                <tr key={b.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 800, color: '#fff', background: getSectionColor(b.section), flexShrink: 0
                      }}>
                        {b.section || '?'}
                      </div>
                      <div>
                        <strong style={{ fontSize: 13 }}>{b.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Section {b.section}</div>
                      </div>
                    </div>
                  </td>
                  <td>{dept ? <span className="badge badge-primary">{dept.code}</span> : '-'}</td>
                  <td><span style={{ fontWeight: 600 }}>Year {b.year}</span></td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{b.studentCount}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11, marginLeft: 4 }}>students</span>
                  </td>
                  <td>
                    {hasWarning ? (
                      <span style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>
                        ⚠️ Exceeds all rooms
                      </span>
                    ) : (
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                          ✅ {suitableRooms.length} lecture room{suitableRooms.length !== 1 ? 's' : ''}
                        </span>
                        {suitableLabs.length > 0 && (
                          <span style={{ color: 'var(--primary)', marginLeft: 8 }}>
                            🔬 {suitableLabs.length} lab{suitableLabs.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(b)}>Edit</button>{' '}
                    <button className="btn btn-sm btn-danger" onClick={() => remove(b.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                  {search || filterDept || filterYear ? '😕 No batches match your filters' : (
                    <div>
                      <p style={{ fontSize: 16, marginBottom: 8 }}>📭 No batches configured yet</p>
                      <p style={{ fontSize: 13 }}>Add batches to split students when they exceed classroom capacity.</p>
                      <p style={{ fontSize: 13 }}>Use <strong>Auto Split</strong> to automatically divide students based on max room capacity.</p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info box */}
      <div style={{
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
        padding: '14px 18px', marginTop: 20, fontSize: 13, color: '#1e40af'
      }}>
        <strong>💡 How batches work:</strong>
        <ul style={{ margin: '6px 0 0 16px', padding: 0, lineHeight: 1.8 }}>
          <li>When batches exist for a department+year, the timetable generator creates <strong>separate schedules per batch</strong>.</li>
          <li>Each batch gets its own classroom assignments, avoiding capacity overflow.</li>
          <li>The same teacher can teach different batches at different times (no teacher conflict).</li>
          <li>If no batches are defined, all students share one schedule (original behavior).</li>
          <li>Max classroom capacity: <strong>{maxClassroomCapacity}</strong> — keep batch sizes at or below this.</li>
        </ul>
      </div>

      {/* Add/Edit Batch Modal */}
      <Modal title={editing?.id ? 'Edit Batch' : 'Add New Batch'} open={showModal} onClose={close}>
        {editing && (
          <div className="form">
            {/* Preview */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: 16,
              background: 'var(--bg)', borderRadius: 12,
              borderLeft: `4px solid ${getSectionColor(editing.section)}`
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800, color: '#fff', background: getSectionColor(editing.section),
                boxShadow: '0 2px 8px rgba(0,0,0,.12)'
              }}>
                {editing.section || '?'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{editing.name || 'Batch Name'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {editing.departmentId && deptMap[editing.departmentId] ? deptMap[editing.departmentId].name : 'Department'} • Year {editing.year} • {editing.studentCount || 0} students
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Batch Name *</label>
                <input
                  value={editing.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Batch A"
                  style={errors.name ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className="form-group" style={{ flex: '0 0 120px' }}>
                <label>Section *</label>
                <input
                  value={editing.section}
                  onChange={e => set('section', e.target.value.toUpperCase())}
                  placeholder="A"
                  maxLength={2}
                  style={errors.section ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.section && <span className="field-error">{errors.section}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select
                  value={editing.departmentId}
                  onChange={e => set('departmentId', e.target.value)}
                  style={errors.departmentId ? { borderColor: 'var(--danger)' } : {}}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                </select>
                {errors.departmentId && <span className="field-error">{errors.departmentId}</span>}
              </div>
              <div className="form-group" style={{ flex: '0 0 120px' }}>
                <label>Year *</label>
                <select
                  value={editing.year}
                  onChange={e => set('year', Number(e.target.value))}
                  style={errors.year ? { borderColor: 'var(--danger)' } : {}}
                >
                  {Array.from({ length: (deptMap[editing.departmentId]?.years || 4) }, (_, i) => i + 1).map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
                {errors.year && <span className="field-error">{errors.year}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Number of Students *</label>
              <input
                type="number"
                min={1}
                max={500}
                value={editing.studentCount}
                onChange={e => set('studentCount', Number(e.target.value))}
                style={errors.studentCount ? { borderColor: 'var(--danger)' } : {}}
              />
              {errors.studentCount && <span className="field-error">{errors.studentCount}</span>}
              {editing.studentCount > maxClassroomCapacity && (
                <span className="field-error" style={{ color: 'var(--warning)' }}>
                  ⚠️ Exceeds largest classroom capacity ({maxClassroomCapacity}). Consider splitting into smaller batches.
                </span>
              )}
            </div>

            {/* Suitable rooms preview */}
            {editing.studentCount > 0 && (
              <div style={{
                background: '#f0f9ff', borderRadius: 8, padding: '10px 14px', fontSize: 12,
                color: 'var(--text-secondary)', marginBottom: 8
              }}>
                <strong>Available rooms for {editing.studentCount} students:</strong>{' '}
                {classrooms.filter(r => r.type === 'lecture' && (r.capacity || 0) >= editing.studentCount).length} lecture rooms,{' '}
                {classrooms.filter(r => r.type === 'lab' && (r.capacity || 0) >= editing.studentCount).length} labs
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>
                {editing.id ? '💾 Update Batch' : '➕ Add Batch'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Auto Split Modal */}
      <Modal title="Auto Split Students into Batches" open={showAutoSplit} onClose={() => setShowAutoSplit(false)}>
        <div className="form">
          <div style={{
            background: '#eff6ff', borderRadius: 8, padding: '12px 16px', fontSize: 13,
            color: '#1e40af', marginBottom: 20
          }}>
            ⚡ Automatically divide students into equal batches based on max classroom capacity.
            This will <strong>replace</strong> any existing batches for the selected department and year.
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department *</label>
              <select
                value={autoSplit.departmentId}
                onChange={e => setAutoSplit(prev => ({ ...prev, departmentId: e.target.value }))}
              >
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: '0 0 120px' }}>
              <label>Year *</label>
              <select
                value={autoSplit.year}
                onChange={e => setAutoSplit(prev => ({ ...prev, year: Number(e.target.value) }))}
              >
                {Array.from({ length: (deptMap[autoSplit.departmentId]?.years || 4) }, (_, i) => i + 1).map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Students</label>
              <input
                type="number"
                min={1}
                value={autoSplit.totalStudents}
                onChange={e => setAutoSplit(prev => ({ ...prev, totalStudents: Number(e.target.value) }))}
              />
            </div>
            <div className="form-group">
              <label>Max per Batch (classroom capacity)</label>
              <input
                type="number"
                min={1}
                value={autoSplit.maxPerBatch}
                onChange={e => setAutoSplit(prev => ({ ...prev, maxPerBatch: Number(e.target.value) }))}
              />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Largest lecture room: {maxClassroomCapacity} seats
              </span>
            </div>
          </div>

          {autoSplit.totalStudents > 0 && autoSplit.maxPerBatch > 0 && (
            <div style={{
              background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', fontSize: 13,
              marginBottom: 8
            }}>
              Will create <strong>{Math.ceil(autoSplit.totalStudents / autoSplit.maxPerBatch)}</strong> batches
              (~<strong>{Math.ceil(autoSplit.totalStudents / Math.ceil(autoSplit.totalStudents / autoSplit.maxPerBatch))}</strong> students each)
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowAutoSplit(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAutoSplit}>
              ⚡ Create Batches
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
