import React from 'react';
import Modal from './Modal';
import { IconAlertTriangle } from './Icons';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn btn-outline" disabled={loading}>
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            color: danger ? 'var(--danger)' : 'var(--warning)',
            padding: '4px',
          }}
        >
          <IconAlertTriangle size={28} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{message}</p>
      </div>
    </Modal>
  );
}

