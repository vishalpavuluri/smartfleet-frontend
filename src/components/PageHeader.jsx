import React from 'react';

export default function PageHeader({
  title,
  subtitle,
  actions,
  children,
}) {
  return (
    <div className="page-header">
      <div className="page-title-wrap">
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {(actions || children) && (
        <div className="page-actions">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}

