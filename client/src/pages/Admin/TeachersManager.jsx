import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../api';
import { toast, Modal, useConfirm } from '../../components/UI';
import DailyView from '../../components/DailyView';
import TimetableGrid, { DAYS } from '../../components/TimetableGrid';

const TITLE_OPTIONS = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.'];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.[0] || '?').toUpperCase();
}

function getAvatarColor(name) {
  const colors = ['#4f46e5','#0ea5e9','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#06b6d4'];
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export default function TeachersManager() {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [confirm, ConfirmDialog] = useConfirm();
  const [timetableTeacher, setTimetableTeacher] = useState(null);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [ttView, setTtView] = useState('weekly');
  const [selectedDay, setSelectedDay] = useState('');
  const [ttLoading, setTtLoading] = useState(false);

  const blank = { name: '', title: '', email: '', phone: '', departmentId: '', specialization: '', office: '', bio: '' };

  const load = useCallback(() => {
    api.getTeachers().then(r => setTeachers(r.data));
  }, []);

  useEffect(() => {
    load();
    api.getDepartments().then(r => setDepartments(r.data));
  }, [load]);

  const filtered = useMemo(() => {
    let list = teachers;
    if (filterDept) list = list.filter(t => t.departmentId === filterDept);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.specialization?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [teachers, search, filterDept]);

  const openAdd = () => { setEditing({ ...blank }); setErrors({}); setShowModal(true); };
  const openEdit = (t) => { setEditing({ ...t }); setErrors({}); setShowModal(true); };
  const close = () => { setEditing(null); setShowModal(false); setErrors({}); };

  const openTimetable = async (teacher) => {
    setTimetableTeacher(teacher);
    setShowTimetableModal(true);
    setTtView('weekly');
    setSelectedDay('Monday');
    setTtLoading(true);
    try {
      const response = await api.getTeacherTimetable(teacher.id);
      setTimetableEntries(response.data || []);
    } catch (e) {
      toast('Failed to load timetable', 'error');
      setTimetableEntries([]);
    } finally {
      setTtLoading(false);
    }
  };

  const closeTimetable = () => {
    setTimetableTeacher(null);
    setShowTimetableModal(false);
    setTimetableEntries([]);
    setSelectedDay('');
  };

  const validate = () => {
    const e = {};
    if (!editing.name?.trim()) e.name = 'Name is required';
    if (!editing.email?.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editing.email)) e.email = 'Invalid email format';
    if (editing.phone && !/^[\d\s\-+()]{7,20}$/.test(editing.phone)) e.phone = 'Invalid phone number';
    if (!editing.departmentId) e.departmentId = 'Department is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    try {
      if (editing.id) {
        await api.updateTeacher(editing.id, editing);
        toast('Teacher updated', 'success');
      } else {
        await api.createTeacher(editing);
        toast('Teacher created', 'success');
      }
      close();
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Save failed', 'error');
    }
  };

  const remove = async (id) => {
    if (!await confirm('Delete Teacher', 'Are you sure? This will affect course assignments.')) return;
    try {
      await api.deleteTeacher(id);
      toast('Teacher deleted', 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const set = (k, v) => {
    setEditing(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  const deptMap = useMemo(() => {
    const m = {};
    departments.forEach(d => { m[d.id] = d; });
    return m;
  }, [departments]);

  return (
    <div>
      <ConfirmDialog />
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Teachers</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>
            {teachers.length} teacher{teachers.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Teacher</button>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-secondary)' }}>🔍</span>
            <input
              placeholder="Search by name, email or specialization..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px 10px 36px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit' }}
            />
          </div>
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            style={{ padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit', minWidth: 180 }}
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="table-wrapper card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Contact</th>
              <th>Department</th>
              <th>Specialization</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const dept = deptMap[t.departmentId];
              return (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, color: '#fff', background: getAvatarColor(t.name), flexShrink: 0
                      }}>
                        {getInitials(t.name)}
                      </div>
                      <div>
                        <strong style={{ fontSize: 13 }}>{t.name}</strong>
                        {t.office && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>📍 {t.office}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{t.email || '-'}</div>
                    {t.phone && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>📞 {t.phone}</div>}
                  </td>
                  <td>{dept ? <span className="badge badge-primary">{dept.code}</span> : '-'}</td>
                  <td>
                    {t.specialization
                      ? <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.specialization}</span>
                      : <span style={{ fontSize: 12, color: '#ccc' }}>—</span>
                    }
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => openTimetable(t)}>View Timetable</button>{' '}
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(t)}>Edit</button>{' '}
                    <button className="btn btn-sm btn-danger" onClick={() => remove(t.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                  {search || filterDept ? '😕 No teachers match your filters' : '📭 No teachers yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal title={editing?.id ? 'Edit Teacher' : 'Add New Teacher'} open={showModal} onClose={close}>
        {editing && (
          <div className="form">
            {/* Avatar Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: 'var(--bg)', borderRadius: 12 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 800, color: '#fff',
                background: editing.name ? getAvatarColor(editing.name) : 'var(--border)',
                transition: 'all .2s', boxShadow: '0 2px 8px rgba(0,0,0,.12)'
              }}>
                {getInitials(editing.name)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{editing.name || 'New Teacher'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {editing.email || 'email@university.edu'}
                </div>
              </div>
            </div>

            {/* Title + Name Row */}
            <div className="form-row">
              <div className="form-group" style={{ flex: '0 0 120px' }}>
                <label>Title</label>
                <select value={editing.title || ''} onChange={e => set('title', e.target.value)}>
                  <option value="">Select</option>
                  {TITLE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  value={editing.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Sharma"
                  style={errors.name ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
            </div>

            {/* Email + Phone Row */}
            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={editing.email || ''}
                  onChange={e => set('email', e.target.value)}
                  placeholder="sharma@university.edu"
                  style={errors.email ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={editing.phone || ''}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  style={errors.phone ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            </div>

            {/* Department + Office Row */}
            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select
                  value={editing.departmentId || ''}
                  onChange={e => set('departmentId', e.target.value)}
                  style={errors.departmentId ? { borderColor: 'var(--danger)' } : {}}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                </select>
                {errors.departmentId && <span className="field-error">{errors.departmentId}</span>}
              </div>
              <div className="form-group">
                <label>Office / Cabin</label>
                <input
                  value={editing.office || ''}
                  onChange={e => set('office', e.target.value)}
                  placeholder="Room 301, Block A"
                />
              </div>
            </div>

            {/* Specialization */}
            <div className="form-group">
              <label>Specialization / Expertise</label>
              <input
                value={editing.specialization || ''}
                onChange={e => set('specialization', e.target.value)}
                placeholder="e.g. Data Structures, Machine Learning, Networks"
              />
              <span className="field-hint">Comma-separated areas of expertise</span>
            </div>

            {/* Bio */}
            <div className="form-group">
              <label>Short Bio</label>
              <textarea
                value={editing.bio || ''}
                onChange={e => set('bio', e.target.value)}
                placeholder="Brief description about the teacher's background and experience..."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Info note for new teachers */}
            {!editing.id && (
              <div className="alert alert-info" style={{ fontSize: 12 }}>
                ℹ️ A login account will be auto-created using the email prefix as username and <strong>teacher123</strong> as the default password.
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>
                {editing.id ? '💾 Update Teacher' : '➕ Add Teacher'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Timetable Modal */}
      <Modal 
        title={timetableTeacher ? `${timetableTeacher.name}'s Timetable` : 'Timetable'} 
        open={showTimetableModal} 
        onClose={closeTimetable}
      >
        {timetableTeacher && (
          <div>
            {/* View Toggle */}
            <div className="btn-group" style={{ marginBottom: 20 }}>
              <button 
                className={`btn ${ttView === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTtView('weekly')}
              >
                📅 Weekly View
              </button>
              <button 
                className={`btn ${ttView === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTtView('daily')}
              >
                📋 Daily View
              </button>
            </div>

            {ttLoading ? (
              <div className="loading">Loading timetable…</div>
            ) : timetableEntries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No timetable assigned</h3>
                <p>This teacher has no classes scheduled yet.</p>
              </div>
            ) : (
              <>
                {ttView === 'weekly' && (
                  <div>
                    <TimetableGrid 
                      entries={timetableEntries}
                      showTeacher={false}
                      showRoom={true}
                    />
                  </div>
                )}

                {ttView === 'daily' && (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Select Day:</label>
                      <div className="btn-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {DAYS.map(d => (
                          <button
                            key={d}
                            className={`btn ${selectedDay === d ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSelectedDay(d)}
                            style={{ flex: 1, minWidth: 100 }}
                          >
                            {d.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <DailyView 
                      entries={timetableEntries.filter(e => e.day === selectedDay && e.status !== 'cancelled')}
                      day={selectedDay}
                      showTeacher={false}
                      showRoom={true}
                    />
                  </div>
                )}
              </>
            )}

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn btn-primary" onClick={closeTimetable}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
