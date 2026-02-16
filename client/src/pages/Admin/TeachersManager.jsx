import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { toast, Modal, useConfirm } from '../../components/UI';

export default function TeachersManager() {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirm, ConfirmDialog] = useConfirm();

  const blank = { name: '', email: '', departmentId: '', subjects: [] };

  const load = useCallback(() => {
    api.getTeachers().then(r => setTeachers(r.data));
  }, []);

  useEffect(() => {
    load();
    api.getDepartments().then(r => setDepartments(r.data));
  }, [load]);

  const openAdd = () => { setEditing({ ...blank }); setShowModal(true); };
  const openEdit = (t) => { setEditing({ ...t }); setShowModal(true); };
  const close = () => { setEditing(null); setShowModal(false); };

  const save = async () => {
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

  const set = (k, v) => setEditing(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      <ConfirmDialog />
      <div className="page-header">
        <h1 className="page-title">Teachers</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Teacher</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => {
              const dept = departments.find(d => d.id === t.departmentId);
              return (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td>{t.email || '-'}</td>
                  <td>{dept?.code || '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(t)}>Edit</button>{' '}
                    <button className="btn btn-sm btn-danger" onClick={() => remove(t.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
            {teachers.length === 0 && <tr><td colSpan={4} className="text-center">No teachers yet</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal title={editing?.id ? 'Edit Teacher' : 'Add Teacher'} open={showModal} onClose={close}>
        {editing && (
          <div className="form">
            <div className="form-group">
              <label>Name *</label>
              <input value={editing.name} onChange={e => set('name', e.target.value)} placeholder="Dr. Smith" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={editing.email || ''} onChange={e => set('email', e.target.value)} placeholder="smith@university.edu" />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select value={editing.departmentId || ''} onChange={e => set('departmentId', e.target.value)}>
                <option value="">Select</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
