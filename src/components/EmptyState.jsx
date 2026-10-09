import React from 'react';
import { IconAlertCircle } from './Icons';

export default function EmptyState({
  title = 'No records found',
  description = 'There are no items to display right now.',
  actionLabel,
  onAction,
  icon: CustomIcon,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        {CustomIcon ? <CustomIcon size={32} /> : <IconAlertCircle size={32} />}
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-description">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary" style={{ marginTop: '8px' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

