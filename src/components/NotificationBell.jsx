import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IconBell, IconCheckCircle } from './Icons';

export default function NotificationBell() {
  const [unreadList, setUnreadList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { mode } = useAuth();

  const fetchUnread = async () => {
    try {
      const res = await notificationAPI.getUnread();
      setUnreadList(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Fail silently for background polling
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationAPI.markAsRead(id);
      setUnreadList((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // ignore
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    const target = mode === 'business' ? '/business/notifications' : '/personal/notifications';
    navigate(target);
  };

  const count = unreadList.length;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn-icon"
        style={{ position: 'relative' }}
        title="Notifications"
        aria-label="Notifications"
      >
        <IconBell size={18} />
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: 'var(--danger)',
              color: 'white',
              fontSize: '0.68rem',
              fontWeight: 700,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 2px var(--bg-surface)',
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '320px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
            <span className="badge badge-primary">{count} Unread</span>
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {unreadList.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No unread notifications
              </div>
            ) : (
              unreadList.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '8px',
                    fontSize: '0.84rem',
                    backgroundColor: 'var(--primary-light)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                      {item.title}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.3 }}>
                      {item.message}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleMarkAsRead(item.id, e)}
                    title="Mark as read"
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <IconCheckCircle size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              padding: '8px 16px',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              textAlign: 'center',
            }}
          >
            <button
              onClick={handleViewAll}
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--primary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              View All Notifications &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

