import React from 'react';

export const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  return '₹' + Number(val).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  isCurrency = false,
  trend,
}) {
  const displayValue = isCurrency ? formatCurrency(value) : value ?? 0;

  return (
    <div className="stat-card">
      <div className="stat-card-info">
        <span className="stat-title">{title}</span>
        <span className="stat-value">{displayValue}</span>
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
        {trend && (
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {trend.text}
          </span>
        )}
      </div>
      {Icon && (
        <div className={`stat-icon-wrapper ${color}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}

