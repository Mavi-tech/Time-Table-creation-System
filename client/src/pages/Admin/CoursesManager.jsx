import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { toast, Modal, useConfirm } from '../../components/UI';

export default function CoursesManager() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirm, ConfirmDialog] = useConfirm();

  const blank = { name: '', code: '', departmentId: '', year: 1, weeklyLectures: 3, weeklyLabs: 0, labDuration: 2, lectureDuration: 1, teacherId: '', type: 'theory' };

  const load = useCallback(() => {
    api.getCourses().then(r => setCourses(r.data));
  }, []);

  useEffect(() => {
    load();
    api.getDepartments().then(r => setDepartments(r.data));
    api.getTeachers().then(r => setTeachers(r.data));
  }, [load]);

  const openAdd = () => { setEditing({ ...blank }); setShowModal(true); };
  const openEdit = (c) => { setEditing({ ...c }); setShowModal(true); };
  const close = () => { setEditing(null); setShowModal(false); };

  const save = async () => {
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
    if (!await confirm('Delete Course', 'Are you sure? This may affect existing timetables.')) return;
    try {
      await api.deleteCourse(id);
      toast('Course deleted', 'success');
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
        <h1 className="page-title">Courses</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Course</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Department</th>
              <th>Year</th>
              <th>Lectures/Week</th>
              <th>Lab</th>
              <th>Teacher</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => {
              const dept = departments.find(d => d.id === c.departmentId);
              const teacher = teachers.find(t => t.id === c.teacherId);
              return (
                <tr key={c.id}>
                  <td><strong>{c.code}</strong></td>
                  <td>{c.name}</td>
                  <td>{dept?.code || '-'}</td>
                  <td>{c.year}</td>
                  <td>{c.weeklyLectures}</td>
                  <td>{c.weeklyLabs > 0 ? `Yes (${c.weeklyLabs}×${c.labDuration || 2}h)` : 'No'}</td>
                  <td>{teacher?.name || '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>Edit</button>{' '}
                    <button className="btn btn-sm btn-danger" onClick={() => remove(c.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
            {courses.length === 0 && <tr><td colSpan={8} className="text-center">No courses yet</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal title={editing?.id ? 'Edit Course' : 'Add Course'} open={showModal} onClose={close}>
        {editing && (
          <div className="form">
            <div className="form-row">
              <div className="form-group">
                <label>Code *</label>
                <input value={editing.code} onChange={e => set('code', e.target.value)} placeholder="CS101" />
              </div>
              <div className="form-group">
                <label>Name *</label>
                <input value={editing.name} onChange={e => set('name', e.target.value)} placeholder="Data Structures" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select value={editing.departmentId} onChange={e => set('departmentId', e.target.value)}>
                  <option value="">Select</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Year *</label>
                <select value={editing.year} onChange={e => set('year', Number(e.target.value))}>
                  {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Lectures/Week *</label>
                <input type="number" min={1} max={6} value={editing.weeklyLectures} onChange={e => set('weeklyLectures', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Teacher</label>
                <select value={editing.teacherId || ''} onChange={e => set('teacherId', e.target.value)}>
                  <option value="">Select</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={(editing.weeklyLabs || 0) > 0} onChange={e => {
                    set('weeklyLabs', e.target.checked ? 2 : 0);
                    set('type', e.target.checked ? 'theory+lab' : 'theory');
                  }} />
                  Has Lab
                </label>
              </div>
              {(editing.weeklyLabs || 0) > 0 && (
                <div className="form-group">
                  <label>Lab Sessions/Week</label>
                  <input type="number" min={1} max={4} value={editing.weeklyLabs} onChange={e => set('weeklyLabs', Number(e.target.value))} />
                </div>
              )}
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
