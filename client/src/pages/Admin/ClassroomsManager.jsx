import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { toast, Modal, useConfirm } from '../../components/UI';

export default function ClassroomsManager() {
  const [classrooms, setClassrooms] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirm, ConfirmDialog] = useConfirm();

  const blank = { name: '', type: 'lecture', capacity: 60 };

  const load = useCallback(() => {
    api.getClassrooms().then(r => setClassrooms(r.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing({ ...blank }); setShowModal(true); };
  const openEdit = (c) => { setEditing({ ...c }); setShowModal(true); };
  const close = () => { setEditing(null); setShowModal(false); };

  const save = async () => {
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
    if (!await confirm('Delete Classroom', 'Are you sure?')) return;
    try {
      await api.deleteClassroom(id);
      toast('Classroom deleted', 'success');
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
        <h1 className="page-title">Classrooms</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Classroom</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classrooms.map(c => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td><span className={`badge badge-${c.type === 'lab' ? 'lab' : 'lecture'}`}>{c.type}</span></td>
                <td>{c.capacity}</td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>Edit</button>{' '}
                  <button className="btn btn-sm btn-danger" onClick={() => remove(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {classrooms.length === 0 && <tr><td colSpan={4} className="text-center">No classrooms yet</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal title={editing?.id ? 'Edit Classroom' : 'Add Classroom'} open={showModal} onClose={close}>
        {editing && (
          <div className="form">
            <div className="form-group">
              <label>Name *</label>
              <input value={editing.name} onChange={e => set('name', e.target.value)} placeholder="Room 101" />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select value={editing.type} onChange={e => set('type', e.target.value)}>
                <option value="lecture">Lecture Hall</option>
                <option value="lab">Lab</option>
              </select>
            </div>
            <div className="form-group">
              <label>Capacity</label>
              <input type="number" min={10} max={500} value={editing.capacity} onChange={e => set('capacity', Number(e.target.value))} />
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
