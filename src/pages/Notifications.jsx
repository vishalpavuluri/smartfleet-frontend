import React, { useState, useEffect } from 'react';
import { notificationAPI, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import {
  IconBell,
  IconCheckCircle,
  IconAlertTriangle,
  IconRefreshCw,
} from '../components/Icons';

export default function Notifications() {
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // ALL | UNREAD | READ

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationAPI.getAll();
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch notifications'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      toast.success('Notification marked as read');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to mark notification as read'));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadItems = notifications.filter((n) => !n.isRead);
    if (unreadItems.length === 0) return;

    try {
      await Promise.allSettled(unreadItems.map((n) => notificationAPI.markAsRead(n.id)));
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      fetchNotifications();
    }
  };

  // Metrics
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filtered List
  const filteredList = notifications.filter((item) => {
    if (filterType === 'UNREAD') return !item.isRead;
    if (filterType === 'READ') return item.isRead;
    return true;
  });

  if (loading) {
    return <Loader text="Loading your notification feeds..." />;
  }

  return (
    <div>
      <PageHeader
        title="Notifications & System Alerts"
        subtitle="Operational broadcasts, maintenance alerts, and deadline notifications"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="btn btn-outline">
                <IconCheckCircle size={16} /> Mark All as Read
              </button>
            )}
            <button onClick={fetchNotifications} className="btn btn-outline" title="Refresh">
              <IconRefreshCw size={16} />
            </button>
          </div>
        }
      />

      <div className="card">
        <div
          className="card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2 className="card-title">Activity Feed</h2>
            <p className="card-subtitle">
              You have <strong style={{ color: 'var(--primary)' }}>{unreadCount}</strong> unread notifications
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilterType('ALL')}
              className={`btn ${filterType === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType('UNREAD')}
              className={`btn ${filterType === 'UNREAD' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilterType('READ')}
              className={`btn ${filterType === 'READ' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>
        </div>

        <div className="card-body">
          {filteredList.length === 0 ? (
            <EmptyState
              title={
                filterType === 'UNREAD'
                  ? 'All caught up!'
                  : 'No notifications present'
              }
              description={
                filterType === 'UNREAD'
                  ? 'There are no pending unread notifications in your feed.'
                  : 'System broadcasts and reminders will appear here when triggered.'
              }
              icon={IconBell}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredList.map((item) => {
                const isUnread = !item.isRead;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: isUnread ? 'var(--primary-light)' : 'var(--bg-surface)',
                      transition: 'all 0.2s ease',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: isUnread ? 'var(--primary)' : 'var(--bg-subtle)',
                          color: isUnread ? 'white' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {item.priority === 'URGENT' || item.priority === 'HIGH' ? (
                          <IconAlertTriangle size={18} />
                        ) : (
                          <IconBell size={18} />
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong
                            style={{
                              fontSize: '0.98rem',
                              color: isUnread ? 'var(--text-main)' : 'var(--text-muted)',
                            }}
                          >
                            {item.title}
                          </strong>
                          {item.priority && (
                            <span
                              className={`badge ${
                                item.priority === 'URGENT'
                                  ? 'badge-danger'
                                  : item.priority === 'HIGH'
                                  ? 'badge-warning'
                                  : 'badge-info'
                              }`}
                              style={{ fontSize: '0.72rem' }}
                            >
                              {item.priority}
                            </span>
                          )}
                          {isUnread && <span className="badge badge-primary">NEW</span>}
                        </div>

                        <p
                          style={{
                            margin: '4px 0 6px 0',
                            color: 'var(--text-main)',
                            fontSize: '0.88rem',
                            lineHeight: 1.4,
                          }}
                        >
                          {item.message}
                        </p>

                        <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent'}
                        </div>
                      </div>
                    </div>

                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(item.id)}
                        className="btn btn-outline"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          flexShrink: 0,
                        }}
                        title="Mark as read"
                      >
                        <IconCheckCircle size={14} /> Mark as Read
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

