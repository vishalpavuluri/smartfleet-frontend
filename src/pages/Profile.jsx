import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import {
  IconUser,
  IconTruck,
  IconCar,
  IconShield,
  IconLogOut,
  IconCheckCircle,
} from '../components/Icons';

export default function Profile() {
  const { user, mode, setMode, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <PageHeader
        title="User & Account Profile"
        subtitle="Manage your operator credentials, application mode, and security session"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Main User Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Profile Information</h2>
            <span className="badge badge-primary">ACTIVE OPERATOR</span>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : <IconUser size={28} />}
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)' }}>
                  {user?.name || 'SmartFleet User'}
                </h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
                  {user?.email || 'user@smartfleet.com'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Full Name:</span>
                <strong style={{ color: 'var(--text-main)' }}>{user?.name || 'Administrator'}</strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Email Address:</span>
                <strong style={{ color: 'var(--text-main)' }}>{user?.email || 'N/A'}</strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Account ID:</span>
                <code style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  USR-{user?.id || 'SECURE'}
                </code>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Current Application Mode:</span>
                <span className={`badge ${mode === 'business' ? 'badge-primary' : 'badge-info'}`}>
                  {mode === 'business' ? 'Transport Business Mode' : 'Personal Vehicle Mode'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '28px', display: 'flex', gap: '12px' }}>
              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', flex: 1 }}
              >
                <IconLogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Mode & Security Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Fleet Operating Mode</h3>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 0 }}>
                SmartFleet allows instant toggling between personal private car management and heavy commercial fleet logistics.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setMode('personal')}
                  className={`btn ${mode === 'personal' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 12px',
                    height: 'auto',
                  }}
                >
                  <IconCar size={24} />
                  <span>Personal Mode</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 'normal' }}>
                    Cars, Bikes, Family EMI
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('business')}
                  className={`btn ${mode === 'business' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 12px',
                    height: 'auto',
                  }}
                >
                  <IconTruck size={24} />
                  <span>Business Mode</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 'normal' }}>
                    Freight, Drivers, P&L
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Security & Session Details</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--success-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconShield size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>JWT Session Active</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Stateless token authentication verified with Spring Security backend
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <IconCheckCircle size={14} style={{ color: 'var(--success-text)' }} />
                  <span>Protected routes and Bearer authorization tokens active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconCheckCircle size={14} style={{ color: 'var(--success-text)' }} />
                  <span>Zero passwords stored or rendered in client components</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

