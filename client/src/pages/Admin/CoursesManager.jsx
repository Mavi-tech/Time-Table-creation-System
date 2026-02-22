import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../api';
import { toast, Modal, useConfirm } from '../../components/UI';

const TYPE_LABELS = {
  theory: { icon: '📖', label: 'Theory', badge: 'badge-primary' },
  'theory+lab': { icon: '🔬', label: 'Theory + Lab', badge: 'badge-purple' },
  lab: { icon: '🧪', label: 'Lab Only', badge: 'badge-success' },
};

function getCourseColor(code) {
  const colors = ['#4f46e5','#0ea5e9','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#06b6d4'];
  let h = 0;
  for (let i = 0; i < (code || '').length; i++) h = code.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export default function CoursesManager() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'table'
  const [collapsedSections, setCollapsedSections] = useState({});
  const [errors, setErrors] = useState({});
  const [confirm, ConfirmDialog] = useConfirm();
  const [deptSearch, setDeptSearch] = useState('');

  const blank = { name: '', code: '', departmentIds: [], year: 1, semester: 1, weeklyLectures: 3, weeklyLabs: 0, labDuration: 2, lectureDuration: 1, teacherId: '', type: 'theory', credits: '', isElective: false };

  const load = useCallback(() => {
    api.getCourses().then(r => setCourses(r.data));
  }, []);

  useEffect(() => {
    load();
    api.getDepartments().then(r => setDepartments(r.data));
    api.getTeachers().then(r => setTeachers(r.data));
  }, [load]);

  const deptMap = useMemo(() => {
    const m = {};
    departments.forEach(d => { m[d.id] = d; });
    return m;
  }, [departments]);

  const teacherMap = useMemo(() => {
    const m = {};
    teachers.forEach(t => { m[t.id] = t; });
    return m;
  }, [teachers]);

  // Filter teachers by selected department(s)    
  const filteredTeachers = useMemo(() => {
    const cDepts = editing?.departmentIds || (editing?.departmentId ? [editing.departmentId] : []);
    if (cDepts.length === 0) return teachers;
    return teachers.filter(t => {
      const tDepts = t.departmentIds || (t.departmentId ? [t.departmentId] : []);
      return tDepts.some(d => cDepts.includes(d)) || tDepts.length === 0;
    });
  }, [teachers, editing?.departmentIds, editing?.departmentId]);

  // Check if selected teacher is assigned to this course
  const teacherMismatchWarning = useMemo(() => {
    if (!editing?.teacherId || !editing?.name) return null;
    const teacher = teachers.find(t => t.id === editing.teacherId);
    if (!teacher) return null;
    // If no courseIds on teacher, skip warning
    if (!teacher.courseIds || teacher.courseIds.length === 0) return null;
    // If we're editing an existing course, check if it's in the teacher's courseIds
    if (editing.id && teacher.courseIds.includes(editing.id)) return null;
    // For new courses, we can't match by ID, so show a note
    if (!editing.id) return null;
    return `${teacher.name} is not assigned to "${editing.name}" in their profile. Consider updating their course assignments.`;
  }, [editing?.teacherId, editing?.name, editing?.id, teachers]);

  const filtered = useMemo(() => {
    let list = courses;
    if (filterDept) list = list.filter(c => {
      const cDepts = c.departmentIds || (c.departmentId ? [c.departmentId] : []);
      return cDepts.includes(filterDept);
    });
    if (filterYear) list = list.filter(c => c.year === Number(filterYear));
    if (filterType) list = list.filter(c => c.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        (teacherMap[c.teacherId]?.name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [courses, search, filterDept, filterYear, filterType, teacherMap]);

  const stats = useMemo(() => ({
    total: courses.length,
    theory: courses.filter(c => c.type === 'theory').length,
    withLab: courses.filter(c => c.type === 'theory+lab' || c.type === 'lab').length,
    totalLectures: courses.reduce((s, c) => s + (c.weeklyLectures || 0), 0),
  }), [courses]);

  // Group filtered courses by department then year
  const groupedCourses = useMemo(() => {
    const groups = {};
    filtered.forEach(c => {
      const cDepts = c.departmentIds || (c.departmentId ? [c.departmentId] : ['_none']);
      // A course with multiple departments appears under each department group
      cDepts.forEach(deptId => {
        const dept = deptMap[deptId];
        const deptKey = deptId || '_none';
        const deptName = dept ? dept.name : 'No Department';
        const deptCode = dept ? dept.code : '—';
        if (!groups[deptKey]) groups[deptKey] = { name: deptName, code: deptCode, id: deptKey, years: {} };
        const yr = c.year || 0;
        if (!groups[deptKey].years[yr]) groups[deptKey].years[yr] = [];
        groups[deptKey].years[yr].push(c);
      });
    });
    // Sort departments alphabetically, years numerically
    return Object.values(groups)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(dept => ({
        ...dept,
        years: Object.entries(dept.years)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([yr, courses]) => ({ year: Number(yr), courses }))
      }));
  }, [filtered, deptMap]);

  const toggleSection = (key) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const openAdd = () => { setEditing({ ...blank }); setErrors({}); setDeptSearch(''); setShowModal(true); };
  const openEdit = (c) => {
    // Migrate old single departmentId to departmentIds array if needed
    const edited = { ...c };
    if (edited.departmentId && !edited.departmentIds) {
      edited.departmentIds = [edited.departmentId];
    }
    if (!edited.departmentIds) edited.departmentIds = [];
    setEditing(edited);
    setErrors({});
    setShowModal(true);
  };
  const close = () => { setEditing(null); setShowModal(false); setErrors({}); setDeptSearch(''); };

  const validate = () => {
    const e = {};
    if (!editing.name?.trim()) e.name = 'Course name is required';
    if (!editing.code?.trim()) e.code = 'Course code is required';
    if (!editing.departmentIds || editing.departmentIds.length === 0) e.departmentIds = 'At least one department is required';
    const maxYr = Math.max(...(editing.departmentIds || []).map(dId => deptMap[dId]?.years || 4), 4);
    if (!editing.year || editing.year < 1 || editing.year > maxYr) e.year = 'Invalid year';
    if (!editing.weeklyLectures || editing.weeklyLectures < 0) e.weeklyLectures = 'Invalid lecture count';
    // Check for duplicate code
    const dup = courses.find(c => c.code?.toLowerCase() === editing.code?.toLowerCase() && c.id !== editing.id);
    if (dup) e.code = `Code "${editing.code}" is already used by ${dup.name}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    try {
      if (editing.id) {
        await api.updateCourse(editing.id, editing);
        toast('Course updated', 'success');
      } else {
        await api.createCourse(editing);
        toast('Course created', 'success');
      }
      close();
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Save failed', 'error');
    }
  };

  const remove = async (id) => {
    const c = courses.find(x => x.id === id);
    if (!await confirm('Delete Course', `Delete "${c?.name || 'this course'}"? This may affect existing timetables.`)) return;
    try {
      await api.deleteCourse(id);
      toast('Course deleted', 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const set = (k, v) => {
    setEditing(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  return (
    <div>
      <ConfirmDialog />
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Courses</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>
            {courses.length} course{courses.length !== 1 ? 's' : ''} across {departments.length} departments
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Course</button>
      </div>

      {/* Stats Cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon blue">📚</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📖</div>
          <div className="stat-info">
            <h3>{stats.theory}</h3>
            <p>Theory Only</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🔬</div>
          <div className="stat-info">
            <h3>{stats.withLab}</h3>
            <p>With Lab</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">🕐</div>
          <div className="stat-info">
            <h3>{stats.totalLectures}</h3>
            <p>Weekly Lectures</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-secondary)' }}>🔍</span>
            <input
              placeholder="Search by name, code or teacher..."
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
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit', minWidth: 140 }}
          >
            <option value="">All Types</option>
            <option value="theory">Theory</option>
            <option value="theory+lab">Theory + Lab</option>
            <option value="lab">Lab Only</option>
          </select>
          <div style={{ display: 'flex', border: '2px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginLeft: 'auto' }}>
            <button
              onClick={() => setViewMode('grouped')}
              style={{
                padding: '8px 14px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: viewMode === 'grouped' ? 'var(--primary)' : '#fff',
                color: viewMode === 'grouped' ? '#fff' : 'var(--text-secondary)',
              }}
            >🗂️ Grouped</button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '8px 14px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                borderLeft: '2px solid var(--border)',
                background: viewMode === 'table' ? 'var(--primary)' : '#fff',
                color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
              }}
            >📋 Table</button>
          </div>
        </div>
      </div>

      {/* Grouped View */}
      {viewMode === 'grouped' && (
        <div>
          {groupedCourses.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              {search || filterDept || filterYear || filterType ? '😕 No courses match your filters' : '📭 No courses yet'}
            </div>
          )}
          {groupedCourses.map(dept => {
            const deptCollapsed = collapsedSections[dept.id];
            const totalInDept = dept.years.reduce((s, y) => s + y.courses.length, 0);
            return (
              <div key={dept.id} className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
                {/* Department Header */}
                <div
                  onClick={() => toggleSection(dept.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px', cursor: 'pointer', userSelect: 'none',
                    background: 'linear-gradient(135deg, var(--primary), #6366f1)',
                    color: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18, transition: 'transform .2s', transform: deptCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>🏛️ {dept.name}</span>
                    <span style={{
                      background: 'rgba(255,255,255,.2)', padding: '2px 10px', borderRadius: 20,
                      fontSize: 12, fontWeight: 600
                    }}>{dept.code}</span>
                  </div>
                  <span style={{ fontSize: 12, opacity: .85, fontWeight: 500 }}>
                    {totalInDept} course{totalInDept !== 1 ? 's' : ''}
                  </span>
                </div>

                {!deptCollapsed && dept.years.map(({ year, courses: yearCourses }) => {
                  const yrKey = `${dept.id}-y${year}`;
                  const yrCollapsed = collapsedSections[yrKey];
                  return (
                    <div key={yrKey}>
                      {/* Year Sub-header */}
                      <div
                        onClick={() => toggleSection(yrKey)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 20px', cursor: 'pointer', userSelect: 'none',
                          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, transition: 'transform .2s', transform: yrCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>📅 Year {year}</span>
                          <span style={{
                            background: 'var(--primary)', color: '#fff', padding: '1px 8px',
                            borderRadius: 12, fontSize: 11, fontWeight: 700
                          }}>{yearCourses.length}</span>
                        </div>
                      </div>

                      {/* Courses in this year */}
                      {!yrCollapsed && (
                        <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                          {yearCourses.map(c => {
                            const teacher = teacherMap[c.teacherId];
                            const tl = TYPE_LABELS[c.type] || TYPE_LABELS.theory;
                            return (
                              <div key={c.id} style={{
                                border: '1px solid var(--border)', borderRadius: 10, padding: 14,
                                flex: '1 1 280px', maxWidth: 380, background: '#fff',
                                borderLeft: `4px solid ${getCourseColor(c.code)}`,
                                transition: 'box-shadow .15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.08)'}
                              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                      width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 11, fontWeight: 800, color: '#fff', background: getCourseColor(c.code), flexShrink: 0
                                    }}>
                                      {(c.code || '??').slice(0, 4)}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        {c.code}{c.semester ? ` • Sem ${c.semester}` : ''}
                                      </div>
                                    </div>
                                  </div>
                                  <span className={`badge ${tl.badge}`} style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{tl.icon} {tl.label}</span>
                                  {c.isElective && <span className="badge" style={{ background: '#f59e0b', color: '#fff', fontSize: 10, marginLeft: 4 }}>🎯 Elective</span>}
                                </div>

                                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                                  <span style={{ background: 'var(--bg)', padding: '2px 8px', borderRadius: 6 }}>
                                    📖 {c.weeklyLectures} lec/wk
                                  </span>
                                  {(c.weeklyLabs || 0) > 0 && (
                                    <span style={{ background: 'var(--bg)', padding: '2px 8px', borderRadius: 6 }}>
                                      🔬 {c.weeklyLabs}×{c.labDuration || 2}h lab
                                    </span>
                                  )}
                                  {teacher ? (
                                    <span style={{ background: 'var(--bg)', padding: '2px 8px', borderRadius: 6 }}>
                                      👨‍🏫 {teacher.name}
                                    </span>
                                  ) : (
                                    <span style={{ background: '#fff3cd', padding: '2px 8px', borderRadius: 6, color: '#856404' }}>
                                      ⚠️ Unassigned
                                    </span>
                                  )}
                                </div>

                                <div style={{ marginTop: 10, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>Edit</button>
                                  <button className="btn btn-sm btn-danger" onClick={() => remove(c.id)}>Delete</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
      <div className="table-wrapper card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Department</th>
              <th>Year / Sem</th>
              <th>Type</th>
              <th>Schedule</th>
              <th>Teacher</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const teacher = teacherMap[c.teacherId];
              const tl = TYPE_LABELS[c.type] || TYPE_LABELS.theory;
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, color: '#fff', background: getCourseColor(c.code), flexShrink: 0,
                        letterSpacing: -.3
                      }}>
                        {(c.code || '??').slice(0, 4)}
                      </div>
                      <div>
                        <strong style={{ fontSize: 13 }}>{c.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{c.code}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {(() => {
                      const cDepts = c.departmentIds || (c.departmentId ? [c.departmentId] : []);
                      return cDepts.length > 0
                        ? <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{cDepts.map(dId => {
                            const d = deptMap[dId];
                            return d ? <span key={dId} className="badge badge-primary">{d.code}</span> : null;
                          })}</div>
                        : '-';
                    })()}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>Y{c.year}</span>
                    {c.semester && <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}> / S{c.semester}</span>}
                  </td>
                  <td>
                    <span className={`badge ${tl.badge}`}>{tl.icon} {tl.label}</span>
                    {c.isElective && <span className="badge" style={{ background: '#f59e0b', color: '#fff', marginLeft: 4, fontSize: 10 }}>Elective</span>}
                  </td>
                  <td>
                    <div style={{ fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>{c.weeklyLectures}</span> lec/wk
                      {(c.weeklyLabs || 0) > 0 && (
                        <span style={{ color: 'var(--success)', marginLeft: 6 }}>
                          + <strong>{c.weeklyLabs}</strong>×{c.labDuration || 2}h lab
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {teacher ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <span>👨‍🏫</span> {teacher.name}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--warning)', fontSize: 12, fontWeight: 500 }}>⚠️ Unassigned</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>Edit</button>{' '}
                    <button className="btn btn-sm btn-danger" onClick={() => remove(c.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                  {search || filterDept || filterYear || filterType ? '😕 No courses match your filters' : '📭 No courses yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      <Modal title={editing?.id ? 'Edit Course' : 'Add New Course'} open={showModal} onClose={close}>
        {editing && (
          <div className="form">
            {/* Preview Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: 16,
              background: 'var(--bg)', borderRadius: 12,
              borderLeft: `4px solid ${getCourseColor(editing.code)}`
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#fff', background: getCourseColor(editing.code),
                boxShadow: '0 2px 8px rgba(0,0,0,.12)', letterSpacing: -.3
              }}>
                {(editing.code || '??').slice(0, 4)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{editing.name || 'Course Name'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {editing.code || 'CODE'} • Year {editing.year} {editing.semester ? `• Sem ${editing.semester}` : ''}
                </div>
              </div>
            </div>

            {/* Code + Name */}
            <div className="form-row">
              <div className="form-group" style={{ flex: '0 0 140px' }}>
                <label>Course Code *</label>
                <input
                  value={editing.code}
                  onChange={e => set('code', e.target.value.toUpperCase())}
                  placeholder="CS201"
                  style={errors.code ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.code && <span className="field-error">{errors.code}</span>}
              </div>
              <div className="form-group">
                <label>Course Name *</label>
                <input
                  value={editing.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Data Structures"
                  style={errors.name ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
            </div>

            {/* Department */}
            <div className="form-group">
              <label>Department(s) * <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-secondary)' }}>(select one or more)</span></label>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-secondary)' }}>🔍</span>
                <input
                  placeholder="Search departments..."
                  value={deptSearch}
                  onChange={e => setDeptSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 32px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              {(() => {
                const filteredDepts = departments.filter(d => {
                  if (!deptSearch.trim()) return true;
                  const q = deptSearch.toLowerCase();
                  return d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
                }).sort((a, b) => {
                  const aChecked = (editing.departmentIds || []).includes(a.id) ? 0 : 1;
                  const bChecked = (editing.departmentIds || []).includes(b.id) ? 0 : 1;
                  return aChecked - bChecked;
                });
                return (
                  <div style={{
                    border: `2px solid ${errors.departmentIds ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 8, padding: '8px 12px', maxHeight: 160, overflowY: 'auto',
                    background: '#fff'
                  }}>
                    {filteredDepts.length > 0 ? filteredDepts.map(d => {
                      const checked = (editing.departmentIds || []).includes(d.id);
                      return (
                        <label key={d.id} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
                          cursor: 'pointer', fontSize: 13, fontWeight: checked ? 600 : 400,
                        }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const prev = editing.departmentIds || [];
                              const next = checked ? prev.filter(id => id !== d.id) : [...prev, d.id];
                              setEditing(p => {
                                const teacher = teachers.find(t => t.id === p.teacherId);
                                const keepTeacher = teacher && next.some(dId => (teacher.departmentIds || (teacher.departmentId ? [teacher.departmentId] : [])).includes(dId));
                                return { ...p, departmentIds: next, teacherId: keepTeacher ? p.teacherId : '' };
                              });
                            }}
                            style={{ width: 16, height: 16 }}
                          />
                          <span className="badge badge-primary" style={{ fontSize: 10 }}>{d.code}</span>
                          {d.name}
                          <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginLeft: 'auto' }}>{d.years || 4}yr</span>
                        </label>
                      );
                    }) : (
                      <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                        😕 No departments matching "{deptSearch}"
                      </div>
                    )}
                  </div>
                );
              })()}
              {errors.departmentIds && <span className="field-error">{errors.departmentIds}</span>}
              {(editing.departmentIds || []).length > 0 && (
                <span className="field-hint">{editing.departmentIds.length} department{editing.departmentIds.length !== 1 ? 's' : ''} selected</span>
              )}
            </div>

            {/* Year + Semester */}
            <div className="form-row">
              <div className="form-group" style={{ flex: '0 0 140px' }}>
                <label>Year *</label>
                {(() => {
                  const selDepts = editing.departmentIds || [];
                  const maxYear = selDepts.length > 0
                    ? Math.max(...selDepts.map(dId => deptMap[dId]?.years || 4))
                    : 4;
                  return (
                    <select
                      value={editing.year}
                      onChange={e => set('year', Number(e.target.value))}
                      style={errors.year ? { borderColor: 'var(--danger)' } : {}}
                    >
                      {Array.from({ length: maxYear }, (_, i) => i + 1).map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  );
                })()}
                {errors.year && <span className="field-error">{errors.year}</span>}
              </div>
              <div className="form-group" style={{ flex: '0 0 100px' }}>
                <label>Semester</label>
                <select value={editing.semester || ''} onChange={e => set('semester', e.target.value ? Number(e.target.value) : '')}>
                  <option value="">—</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
            </div>

            {/* Teacher + Credits */}
            <div className="form-row">
              <div className="form-group">
                <label>Teacher</label>
                <select value={editing.teacherId || ''} onChange={e => set('teacherId', e.target.value)}>
                  <option value="">Select Teacher</option>
                  {filteredTeachers.map(t => {
                    const tCourses = (t.courseIds || []).map(cid => {
                      const course = courses.find(c => c.id === cid);
                      return course?.code;
                    }).filter(Boolean);
                    const courseInfo = tCourses.length > 0 ? ` — ${tCourses.slice(0, 3).join(', ')}${tCourses.length > 3 ? '…' : ''}` : '';
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name}{courseInfo}
                      </option>
                    );
                  })}
                </select>
                {editing.departmentIds?.length > 0 && filteredTeachers.length < teachers.length && (
                  <span className="field-hint">Showing {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''} from selected department{editing.departmentIds.length > 1 ? 's' : ''}</span>
                )}
                {editing.departmentIds?.length > 0 && filteredTeachers.length === 0 && (
                  <span className="field-hint" style={{ color: 'var(--warning)' }}>⚠️ No teachers assigned to selected department{editing.departmentIds.length > 1 ? 's' : ''} yet</span>
                )}
                {teacherMismatchWarning && (
                  <div style={{
                    marginTop: 6, padding: '6px 10px', borderRadius: 6,
                    background: '#fff3cd', border: '1px solid #ffc107',
                    fontSize: 12, color: '#856404', display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    ⚠️ {teacherMismatchWarning}
                  </div>
                )}
              </div>
              <div className="form-group" style={{ flex: '0 0 100px' }}>
                <label>Credits</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={editing.credits || ''}
                  onChange={e => set('credits', e.target.value ? Number(e.target.value) : '')}
                  placeholder="—"
                />
              </div>
            </div>

            {/* Schedule Section */}
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: .5 }}>
                📅 Weekly Schedule
              </h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Lectures / Week *</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={editing.weeklyLectures}
                    onChange={e => set('weeklyLectures', Number(e.target.value))}
                    style={errors.weeklyLectures ? { borderColor: 'var(--danger)' } : {}}
                  />
                  {errors.weeklyLectures && <span className="field-error">{errors.weeklyLectures}</span>}
                </div>
                <div className="form-group">
                  <label>Lecture Duration (hrs)</label>
                  <select value={editing.lectureDuration || 1} onChange={e => set('lectureDuration', Number(e.target.value))}>
                    <option value={1}>1 hour</option>
                    <option value={2}>2 hours</option>
                  </select>
                </div>
              </div>

              {/* Elective toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={!!editing.isElective}
                    onChange={e => set('isElective', e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  🎯 This is an elective course (students choose to enroll)
                </label>
              </div>

              {/* Lab toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: (editing.weeklyLabs || 0) > 0 ? 12 : 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={(editing.weeklyLabs || 0) > 0}
                    onChange={e => {
                      set('weeklyLabs', e.target.checked ? 2 : 0);
                      set('type', e.target.checked ? 'theory+lab' : 'theory');
                    }}
                    style={{ width: 16, height: 16 }}
                  />
                  🔬 This course has lab sessions
                </label>
              </div>

              {(editing.weeklyLabs || 0) > 0 && (
                <div className="form-row" style={{ marginTop: 8 }}>
                  <div className="form-group">
                    <label>Lab Sessions / Week</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={editing.weeklyLabs}
                      onChange={e => set('weeklyLabs', Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Lab Duration (hrs)</label>
                    <select value={editing.labDuration || 2} onChange={e => set('labDuration', Number(e.target.value))}>
                      <option value={1}>1 hour</option>
                      <option value={2}>2 hours</option>
                      <option value={3}>3 hours</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div style={{
              display: 'flex', gap: 16, padding: '12px 16px', background: '#f0f9ff', borderRadius: 8,
              fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8
            }}>
              <span>📖 <strong>{editing.weeklyLectures || 0}</strong> lecture{editing.weeklyLectures !== 1 ? 's' : ''}/wk × {editing.lectureDuration || 1}h</span>
              {(editing.weeklyLabs || 0) > 0 && (
                <span>🔬 <strong>{editing.weeklyLabs}</strong> lab{editing.weeklyLabs !== 1 ? 's' : ''}/wk × {editing.labDuration || 2}h</span>
              )}
              <span>⏱️ Total: <strong>{(editing.weeklyLectures || 0) * (editing.lectureDuration || 1) + (editing.weeklyLabs || 0) * (editing.labDuration || 2)}</strong> hrs/wk</span>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>
                {editing.id ? '💾 Update Course' : '➕ Add Course'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
