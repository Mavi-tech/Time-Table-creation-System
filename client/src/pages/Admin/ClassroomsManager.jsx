import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../api';
import { toast, Modal, useConfirm } from '../../components/UI';

const TYPE_CONFIG = {
  lecture: { icon: '🏫', label: 'Lecture Hall', badge: 'badge-primary', color: '#4f46e5' },
  lab: { icon: '🔬', label: 'Laboratory', badge: 'badge-success', color: '#22c55e' },
};

const BUILDING_COLORS = ['#4f46e5','#0ea5e9','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444'];
function getBuildingColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return BUILDING_COLORS[Math.abs(h) % BUILDING_COLORS.length];
}

function getCapacityLevel(cap) {
  if (cap >= 80) return { label: 'Large', color: 'var(--primary)' };
  if (cap >= 40) return { label: 'Medium', color: 'var(--warning)' };
  return { label: 'Small', color: 'var(--success)' };
}

export default function ClassroomsManager() {
  const [classrooms, setClassrooms] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [errors, setErrors] = useState({});
  const [confirm, ConfirmDialog] = useConfirm();

  const blank = { name: '', type: 'lecture', capacity: 60, building: '', floor: '', facilities: '' };

  const load = useCallback(() => {
    api.getClassrooms().then(r => setClassrooms(r.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  const buildings = useMemo(() => {
    const set = new Set(classrooms.map(c => c.building).filter(Boolean));
    return [...set].sort();
  }, [classrooms]);

  const filtered = useMemo(() => {
    let list = classrooms;
    if (filterType) list = list.filter(c => c.type === filterType);
    if (filterBuilding) list = list.filter(c => c.building === filterBuilding);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.building?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [classrooms, search, filterType, filterBuilding]);

  const stats = useMemo(() => ({
    total: classrooms.length,
    lectures: classrooms.filter(c => c.type === 'lecture').length,
    labs: classrooms.filter(c => c.type === 'lab').length,
    totalCapacity: classrooms.reduce((s, c) => s + (c.capacity || 0), 0),
  }), [classrooms]);

  const openAdd = () => { setEditing({ ...blank }); setErrors({}); setShowModal(true); };
  const openEdit = (c) => { setEditing({ ...c }); setErrors({}); setShowModal(true); };
  const close = () => { setEditing(null); setShowModal(false); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!editing.name?.trim()) e.name = 'Room name is required';
    if (!editing.type) e.type = 'Type is required';
    if (!editing.capacity || editing.capacity < 1) e.capacity = 'Capacity must be at least 1';
    else if (editing.capacity > 1000) e.capacity = 'Capacity seems too large';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    try {
      if (editing.id) {
        await api.updateClassroom(editing.id, editing);
        toast('Classroom updated', 'success');
      } else {
        await api.createClassroom(editing);
        toast('Classroom created', 'success');
      }
      close();
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Save failed', 'error');
    }
  };

  const remove = async (id) => {
    if (!await confirm('Delete Classroom', 'Are you sure? This may affect timetable assignments.')) return;
    try {
      await api.deleteClassroom(id);
      toast('Classroom deleted', 'success');
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
          <h1 className="page-title">Classrooms</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>
            Manage lecture halls, labs, and other rooms
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Classroom</button>
      </div>

      {/* Stats Cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon blue">🏫</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Rooms</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📖</div>
          <div className="stat-info">
            <h3>{stats.lectures}</h3>
            <p>Lecture Halls</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🔬</div>
          <div className="stat-info">
            <h3>{stats.labs}</h3>
            <p>Laboratories</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">👥</div>
          <div className="stat-info">
            <h3>{stats.totalCapacity}</h3>
            <p>Total Capacity</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-secondary)' }}>🔍</span>
            <input
              placeholder="Search by room name or building..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px 10px 36px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit' }}
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit', minWidth: 150 }}
          >
            <option value="">All Types</option>
            <option value="lecture">Lecture Halls</option>
            <option value="lab">Laboratories</option>
          </select>
          {buildings.length > 0 && (
            <select
              value={filterBuilding}
              onChange={e => setFilterBuilding(e.target.value)}
              style={{ padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit', minWidth: 150 }}
            >
              <option value="">All Buildings</option>
              {buildings.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Classroom Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map(c => {
          const cfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.lecture;
          const cap = getCapacityLevel(c.capacity);
          return (
            <div key={c.id} className="card" style={{ padding: 0, overflow: 'hidden', transition: 'transform .15s, box-shadow .15s' }}>
              {/* Type stripe */}
              <div style={{ height: 4, background: cfg.color }} />
              <div style={{ padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, background: c.type === 'lab' ? '#f0fdf4' : '#eef2ff', flexShrink: 0
                    }}>
                      {cfg.icon}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{c.name}</h4>
                      <span className={`badge ${cfg.badge}`} style={{ marginTop: 4 }}>{cfg.label}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {/* Capacity bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Capacity</span>
                      <span style={{ fontWeight: 700 }}>{c.capacity} seats</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3, background: cap.color,
                        width: `${Math.min((c.capacity / 120) * 100, 100)}%`, transition: 'width .3s'
                      }} />
                    </div>
                  </div>
                  {c.building && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: 2, background: getBuildingColor(c.building), flexShrink: 0
                      }} />
                      {c.building}{c.floor ? `, Floor ${c.floor}` : ''}
                    </div>
                  )}
                  {c.facilities && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                      {c.facilities.split(',').map((f, i) => (
                        <span key={i} style={{
                          padding: '2px 8px', borderRadius: 4, background: 'var(--bg)', fontSize: 10,
                          fontWeight: 600, color: 'var(--text-secondary)'
                        }}>
                          {f.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => openEdit(c)}>✏️ Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(c.id)}>🗑️</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">{search || filterType || filterBuilding ? '😕' : '🏫'}</div>
          <h3>{search || filterType || filterBuilding ? 'No classrooms match your filters' : 'No classrooms yet'}</h3>
          <p>{search || filterType || filterBuilding ? 'Try different filter options' : 'Add your first classroom to get started'}</p>
        </div>
      )}

      <Modal title={editing?.id ? 'Edit Classroom' : 'Add New Classroom'} open={showModal} onClose={close}>
        {editing && (
          <div className="form">
            {/* Preview */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: 16,
              background: 'var(--bg)', borderRadius: 12,
              borderLeft: `4px solid ${(TYPE_CONFIG[editing.type] || TYPE_CONFIG.lecture).color}`
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.08)'
              }}>
                {(TYPE_CONFIG[editing.type] || TYPE_CONFIG.lecture).icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{editing.name || 'Room Name'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {(TYPE_CONFIG[editing.type] || TYPE_CONFIG.lecture).label} • {editing.capacity || 0} seats
                  {editing.building ? ` • ${editing.building}` : ''}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Room Name *</label>
              <input
                value={editing.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Room 101, CS Lab 1"
                style={errors.name ? { borderColor: 'var(--danger)' } : {}}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => set('type', key)}
                      className={`btn btn-sm ${editing.type === key ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, justifyContent: 'center', padding: '10px 12px' }}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
                {errors.type && <span className="field-error">{errors.type}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Capacity (Seats) *</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={editing.capacity}
                  onChange={e => set('capacity', Number(e.target.value))}
                  style={errors.capacity ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.capacity && <span className="field-error">{errors.capacity}</span>}
              </div>
              <div className="form-group">
                <label>Floor</label>
                <input
                  value={editing.floor || ''}
                  onChange={e => set('floor', e.target.value)}
                  placeholder="e.g. Ground, 1st, 2nd"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Building</label>
              <input
                value={editing.building || ''}
                onChange={e => set('building', e.target.value)}
                placeholder="e.g. Block A, Main Building"
                list="building-suggestions"
              />
              <datalist id="building-suggestions">
                {buildings.map(b => <option key={b} value={b} />)}
              </datalist>
              <span className="field-hint">Re-use existing building names for consistency</span>
            </div>

            <div className="form-group">
              <label>Facilities / Equipment</label>
              <input
                value={editing.facilities || ''}
                onChange={e => set('facilities', e.target.value)}
                placeholder="e.g. Projector, AC, Whiteboard, Computers"
              />
              <span className="field-hint">Comma-separated list of available facilities</span>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>
                {editing.id ? '💾 Update Classroom' : '➕ Add Classroom'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
