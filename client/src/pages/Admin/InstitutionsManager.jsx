import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { toast, useConfirm, Modal } from '../../components/UI';

export default function InstitutionsManager() {
  const { tenant } = useAuth();
  const activeUniversityId = tenant?.universityId || '';
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirm, ConfirmDialog] = useConfirm();

  // Custom alert modal state
  const [promptOpen, setPromptOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [authInput, setAuthInput] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getTenants();
      setUniversities(data || []);
    } catch (error) {
      toast(error.response?.data?.error || 'Failed to load institutions', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    // Only show the active university for this tenant
    const adminUniList = universities.filter(u => u.id === activeUniversityId);
    
    const q = search.trim().toLowerCase();
    if (!q) return adminUniList;
    return adminUniList.filter(uni => {
      const uniHit = [uni.name, uni.shortName, uni.id].some(v => String(v || '').toLowerCase().includes(q));
      const campusHit = (uni.campuses || []).some(campus =>
        [campus.name, campus.id, campus.dbName].some(v => String(v || '').toLowerCase().includes(q))
      );
      return uniHit || campusHit;
    });
  }, [universities, search, activeUniversityId]);

  const initiateDeleteUniversity = (uni) => {
    setPendingDelete({ type: 'university', uni });
    setAuthInput('');
    setPromptOpen(true);
  };

  const initiateDeleteCampus = (uni, campus) => {
    setPendingDelete({ type: 'campus', uni, campus });
    setAuthInput('');
    setPromptOpen(true);
  };

  const executeDelete = async (e) => {
    e.preventDefault();
    if (!pendingDelete) return;

    const { type, uni, campus } = pendingDelete;
    const targetName = type === 'university' ? uni.name : campus.name;

    if (authInput !== targetName) {
      toast('Authentication failed. Name did not match.', 'error');
      return;
    }

    if (type === 'university') {
      const campusCount = uni.campuses?.length || 0;
      const message = `Are you absolutely sure? This will remove ${campusCount} campus${campusCount === 1 ? '' : 'es'} and you will lose access.`;
      if (!await confirm('Delete University', message)) {
        setPromptOpen(false);
        return;
      }
      try {
        await api.deleteUniversity(uni.id);
        toast('University deleted', 'success');
        window.location.href = '/landing'; 
      } catch (error) {
        toast(error.response?.data?.error || 'Failed to delete university', 'error');
      }
    } else if (type === 'campus') {
      const isLastCampus = (uni.campuses || []).length <= 1;
      const message = isLastCampus
        ? `Are you sure? This is the last campus, so the university entry will also be removed.`
        : `Are you sure you want to delete ${campus.name}?`;
      if (!await confirm('Delete Campus', message)) {
        setPromptOpen(false);
        return;
      }
      try {
        await api.deleteCampus(uni.id, campus.id);
        toast('Campus deleted', 'success');
        if (isLastCampus) {
          window.location.href = '/landing';
        } else {
          await load();
        }
      } catch (error) {
        toast(error.response?.data?.error || 'Failed to delete campus', 'error');
      }
    }

    setPromptOpen(false);
    setPendingDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Institution Management</h1>
        <p className="page-subtitle">Delete universities or individual campuses with admin-only access.</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by university, campus, or database name..."
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--card)',
            fontFamily: 'inherit',
            fontSize: 14,
          }}
        />
      </div>

      {loading ? (
        <div className="card" style={{ padding: 24 }}>Loading institutions...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 24 }}>No institutions match your search.</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map(uni => (
            <div key={uni.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 20 }}>{uni.name}</h3>
                    <span className="badge badge-primary">{uni.shortName}</span>
                  </div>
                  <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
                    {uni.campuses?.length || 0} campus{(uni.campuses?.length || 0) === 1 ? '' : 'es'}
                  </div>
                </div>

                {activeUniversityId === uni.id && (
                  <button
                    className="btn btn-danger"
                    onClick={() => initiateDeleteUniversity(uni)}
                    title="Delete this university"
                  >
                    Delete University
                  </button>
                )}
              </div>

              <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                {(uni.campuses || []).map(campus => (
                  <div key={campus.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-soft)',
                    flexWrap: 'wrap',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{campus.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{campus.dbName}</div>
                    </div>
                    {activeUniversityId === uni.id && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => initiateDeleteCampus(uni, campus)}
                        title="Delete this campus"
                      >
                        Delete Campus
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={promptOpen} onClose={() => { setPromptOpen(false); setPendingDelete(null); }} title="Authentication Required">
        <form onSubmit={executeDelete}>
          <p style={{ marginBottom: 16 }}>
            Please type the {pendingDelete?.type} name <strong>"{pendingDelete?.type === 'university' ? pendingDelete?.uni?.name : pendingDelete?.campus?.name}"</strong> to confirm deletion:
          </p>
          <input
            type="text"
            value={authInput}
            onChange={e => setAuthInput(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setPromptOpen(false); setPendingDelete(null); }}>Cancel</button>
            <button type="submit" className="btn btn-danger">Confirm</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog />
    </div>
  );
}