import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../api';
import { toast, Modal, useConfirm } from '../../components/UI';

const DEPT_ICONS = ['🏛️','🔬','⚙️','🏗️','💡','🧪','🖥️','📐','🌾','🍔','🏭','📡'];

function getDeptIcon(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return DEPT_ICONS[Math.abs(h) % DEPT_ICONS.length];
}

function getDeptColor(code) {
  const colors = [
    { bg: '#dbeafe', text: '#1d4ed8' },
    { bg: '#dcfce7', text: '#15803d' },
    { bg: '#f3e8ff', text: '#7c3aed' },
    { bg: '#fef3c7', text: '#b45309' },
    { bg: '#fce7f3', text: '#be185d' },
    { bg: '#ccfbf1', text: '#0f766e' },
    { bg: '#fee2e2', text: '#dc2626' },
    { bg: '#e0e7ff', text: '#4338ca' },
  ];
  let h = 0;
  for (let i = 0; i < (code || '').length; i++) h = code.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export default function DepartmentsManager() {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState({});
  const [confirm, ConfirmDialog] = useConfirm();

  const blank = { name: '', code: '', years: 4, hod: '', description: '' };

  const load = useCallback(() => {
    api.getDepartments().then(r => setDepartments(r.data));
    api.getCourses().then(r => setCourses(r.data));
    api.getTeachers().then(r => setTeachers(r.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return departments;
    const q = search.toLowerCase();
    return departments.filter(d =>
      d.name?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q)
    );
  }, [departments, search]);

  const deptStats = useMemo(() => {
    const stats = {};
    departments.forEach(d => {
      stats[d.id] = {
        courses: courses.filter(c => c.departmentId === d.id).length,
        teachers: teachers.filter(t => t.departmentId === d.id).length,
      };
    });
    return stats;
  }, [departments, courses, teachers]);

  const openAdd = () => { setEditing({ ...blank }); setErrors({}); setShowModal(true); };
  const openEdit = (d) => { setEditing({ ...d }); setErrors({}); setShowModal(true); };
  const close = () => { setEditing(null); setShowModal(false); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!editing.name?.trim()) e.name = 'Department name is required';
    if (!editing.code?.trim()) e.code = 'Code is required';
    else if (editing.code.length > 6) e.code = 'Code should be 6 chars or less';
    if (!editing.years || editing.years < 1 || editing.years > 6) e.years = 'Years must be between 1 and 6';
    const dup = departments.find(d => d.code?.toLowerCase() === editing.code?.toLowerCase() && d.id !== editing.id);
    if (dup) e.code = `Code "${editing.code}" is already used by ${dup.name}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    try {
      if (editing.id) {
        await api.updateDepartment(editing.id, editing);
        toast('Department updated', 'success');
      } else {
        await api.createDepartment(editing);
        toast('Department created', 'success');
      }
      close();
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Save failed', 'error');
    }
  };

  const remove = async (id) => {
    const st = deptStats[id] || {};
    const warn = [];
    if (st.courses) warn.push(`${st.courses} course(s)`);
    if (st.teachers) warn.push(`${st.teachers} teacher(s)`);
    const extra = warn.length ? ` This department has ${warn.join(' and ')}.` : '';
    if (!await confirm('Delete Department', `Are you sure you want to delete this department?${extra}`)) return;
    try {
      await api.deleteDepartment(id);
      toast('Department deleted', 'success');
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
          <h1 className="page-title">Departments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>
            {departments.length} department{departments.length !== 1 ? 's' : ''} • {courses.length} courses • {teachers.length} teachers
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Department</button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-secondary)' }}>🔍</span>
          <input
            placeholder="Search departments by name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 36px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* Department Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map(d => {
          const color = getDeptColor(d.code);
          const st = deptStats[d.id] || {};
          return (
            <div key={d.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ background: color.bg, padding: '20px 20px 16px', borderBottom: `2px solid ${color.text}22` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.08)'
                    }}>
                      {getDeptIcon(d.name)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{d.name}</h3>
                      <span style={{
                        display: 'inline-block', marginTop: 4, padding: '2px 10px', borderRadius: 6,
                        fontSize: 11, fontWeight: 700, background: color.text, color: '#fff', letterSpacing: .5
                      }}>
                        {d.code}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {d.hod && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    👤 <strong>HOD:</strong> {d.hod}
                  </div>
                )}
                {d.description && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                    {d.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <span style={{ fontSize: 16 }}>📅</span>
                    <span><strong>{d.years || 4}</strong> year{(d.years || 4) !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <span style={{ fontSize: 16 }}>📚</span>
                    <span><strong>{st.courses || 0}</strong> course{st.courses !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <span style={{ fontSize: 16 }}>👨‍🏫</span>
                    <span><strong>{st.teachers || 0}</strong> teacher{st.teachers !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => openEdit(d)}>✏️ Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(d.id)}>🗑️</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">{search ? '😕' : '🏛️'}</div>
          <h3>{search ? 'No departments match your search' : 'No departments yet'}</h3>
          <p>{search ? 'Try a different search term' : 'Add your first department to get started'}</p>
        </div>
      )}

      <Modal title={editing?.id ? 'Edit Department' : 'Add New Department'} open={showModal} onClose={close}>
        {editing && (
          <div className="form">
            {/* Preview Strip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: 16,
              background: editing.code ? getDeptColor(editing.code).bg : 'var(--bg)', borderRadius: 12, transition: 'all .2s'
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.08)'
              }}>
                {getDeptIcon(editing.name)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{editing.name || 'Department Name'}</div>
                {editing.code && (
                  <span style={{
                    display: 'inline-block', marginTop: 3, padding: '2px 10px', borderRadius: 6,
                    fontSize: 11, fontWeight: 700, background: getDeptColor(editing.code).text, color: '#fff'
                  }}>
                    {editing.code}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Department Name *</label>
              <input
                value={editing.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Computer Science"
                style={errors.name ? { borderColor: 'var(--danger)' } : {}}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Code *</label>
                <input
                  value={editing.code}
                  onChange={e => set('code', e.target.value.toUpperCase())}
                  placeholder="CS"
                  maxLength={6}
                  style={errors.code ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.code && <span className="field-error">{errors.code}</span>}
                <span className="field-hint">Short unique identifier (max 6 chars)</span>
              </div>
              <div className="form-group">
                <label>Duration (Years) *</label>
                <select
                  value={editing.years || 4}
                  onChange={e => set('years', Number(e.target.value))}
                  style={errors.years ? { borderColor: 'var(--danger)' } : {}}
                >
                  {[1,2,3,4,5,6].map(y => <option key={y} value={y}>{y} Year{y !== 1 ? 's' : ''}</option>)}
                </select>
                {errors.years && <span className="field-error">{errors.years}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Head of Department (HOD)</label>
              <input
                value={editing.hod || ''}
                onChange={e => set('hod', e.target.value)}
                placeholder="e.g. Dr. Sharma"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editing.description || ''}
                onChange={e => set('description', e.target.value)}
                placeholder="Brief description of the department..."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>
                {editing.id ? '💾 Update Department' : '➕ Add Department'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
