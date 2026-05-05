import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// Toast system
let toastListeners = [];
export function toast(msg, type = 'success') {
  toastListeners.forEach(fn => fn({ msg, type, id: Date.now() }));
}
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter(f => f !== handler); };
  }, []);
  return (
    <div className="toast-container">
      {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
    </div>
  );
}

// Modal
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  );
}

// Confirm dialog (custom)
export function useConfirm() {
  const [promise, setPromise] = useState(null);

  const confirm = useCallback((title, message) => {
    return new Promise((resolve) => {
      setPromise({ title, message, resolve });
    });
  }, []);

  const handleClose = useCallback((result) => {
    if (promise) promise.resolve(result);
    setPromise(null);
  }, [promise]);

  const ConfirmDialog = useCallback(() => {
    if (!promise) return null;
    return (
      <Modal open={true} onClose={() => handleClose(false)} title={promise.title}>
        <p style={{ marginBottom: 16 }}>{promise.message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => handleClose(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleClose(true)}>Confirm</button>
        </div>
      </Modal>
    );
  }, [promise, handleClose]);

  return [confirm, ConfirmDialog];
}
