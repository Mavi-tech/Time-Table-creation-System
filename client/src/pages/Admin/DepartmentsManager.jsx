import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { toast, Modal, useConfirm } from '../../components/UI';

export default function DepartmentsManager() {
  const [departments, setDepartments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirm, ConfirmDialog] = useConfirm();

  const blank = { name: '', code: '', years: 4 };

  const load = useCallback(() => {
    api.getDepartments().then(r => setDepartments(r.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing({ ...blank }); setShowModal(true); };
  const openEdit = (d) => { setEditing({ ...d }); setShowModal(true); };
  const close = () => { setEditing(null); setShowModal(false); };

  const save = async () => {
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
    if (!await confirm('Delete Department', 'This will also remove related courses. Continue?')) return;
    try {
      await api.deleteDepartment(id);
      toast('Department deleted', 'success');
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
        <h1 className="page-title">Departments</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Department</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Years</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(d => (
              <tr key={d.id}>
                <td><strong>{d.name}</strong></td>
                <td>{d.code}</td>
                <td>{d.years || 4}</td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(d)}>Edit</button>{' '}
                  <button className="btn btn-sm btn-danger" onClick={() => remove(d.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && <tr><td colSpan={4} className="text-center">No departments yet</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal title={editing?.id ? 'Edit Department' : 'Add Department'} open={showModal} onClose={close}>
        {editing && (
          <div className="form">
            <div className="form-group">
              <label>Name *</label>
              <input value={editing.name} onChange={e => set('name', e.target.value)} placeholder="Computer Science" />
            </div>
            <div className="form-group">
              <label>Code *</label>
              <input value={editing.code} onChange={e => set('code', e.target.value)} placeholder="CS" />
            </div>
            <div className="form-group">
              <label>Number of Years</label>
              <input type="number" min={1} max={6} value={editing.years} onChange={e => set('years', Number(e.target.value))} />
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
