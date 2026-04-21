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

// Confirm dialog (simple)
export function useConfirm() {
  const confirm = useCallback((title, message) => window.confirm(message || title), []);
  const ConfirmDialog = () => null;
  return [confirm, ConfirmDialog];
}
