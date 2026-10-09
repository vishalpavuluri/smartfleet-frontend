import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModeSwitcher from './ModeSwitcher';
import NotificationBell from './NotificationBell';
import { IconMenu, IconTruck, IconUser, IconLogOut } from './Icons';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn-icon"
          style={{ display: 'none' }}
          id="mobile-menu-btn"
          title="Toggle Navigation"
        >
          <IconMenu size={20} />
        </button>

        <div className="brand-badge" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">
            <IconTruck size={20} />
          </div>
          <span>SmartFleet</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Mode Switcher */}
        <ModeSwitcher />

        {/* Notifications */}
        <NotificationBell />

        {/* User profile dropdown / info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-subtle)',
              cursor: 'pointer',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
            title="View Profile"
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <IconUser size={14} />}
            </div>
            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="btn-icon"
            style={{ color: 'var(--danger)' }}
            title="Log out"
            aria-label="Log out"
          >
            <IconLogOut size={17} />
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #mobile-menu-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
}

