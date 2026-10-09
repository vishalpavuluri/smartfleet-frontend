import React, { useState, useEffect } from 'react';
import {
  voiceCallAPI,
  reminderAPI,
  getErrorMessage,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import {
  IconPhone,
  IconPlus,
  IconCheckCircle,
  IconAlertTriangle,
  IconClock,
  IconSearch,
  IconRefreshCw,
} from '../components/Icons';

export default function VoiceCalls() {
  const toast = useToast();

  const [callLogs, setCallLogs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Trigger Call Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState('');
  const [triggering, setTriggering] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [callRes, remRes] = await Promise.allSettled([
        voiceCallAPI.getLogs(),
        reminderAPI.getAll(),
      ]);

      if (callRes.status === 'fulfilled') setCallLogs(callRes.value.data || []);
      if (remRes.status === 'fulfilled') {
        const rList = remRes.value.data || [];
        setReminders(rList);
        if (rList.length > 0 && !selectedReminderId) {
          setSelectedReminderId(String(rList[0].id));
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch voice call logs'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerCall = async (e) => {
    e.preventDefault();
    if (!selectedReminderId) {
      toast.error('Please select a reminder to generate voice call dispatch');
      return;
    }

    try {
      setTriggering(true);
      await voiceCallAPI.createCallLog(Number(selectedReminderId));
      toast.success('Voice call log created and queued for automated dispatch!');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to trigger voice call dispatch'));
    } finally {
      setTriggering(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await voiceCallAPI.updateStatus(id, status);
      toast.success(`Call status updated to ${status}`);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update call status'));
    }
  };

  // Metrics
  const totalCalls = callLogs.length;
  const completedCalls = callLogs.filter((c) => c.callStatus === 'COMPLETED').length;
  const pendingOrFailed = callLogs.filter((c) => c.callStatus !== 'COMPLETED').length;

  // Filtered List
  const filteredCalls = callLogs.filter((c) => {
    const searchMatch =
      !searchTerm ||
      c.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.language?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.reminder?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = filterStatus === 'ALL' || c.callStatus === filterStatus;

    return searchMatch && statusMatch;
  });

  if (loading) {
    return <Loader text="Loading voice call logs and telephony queues..." />;
  }

  return (
    <div>
      <PageHeader
        title="Voice Call Logs & History"
        subtitle="Audit automated voice reminder calls, delivery statuses, and audio notification transcripts"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <IconPlus size={16} /> Dispatch Voice Reminder
            </button>
            <button onClick={fetchData} className="btn btn-outline" title="Refresh">
              <IconRefreshCw size={16} />
            </button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard
          label="Total Call Dispatches"
          value={totalCalls}
          subtext="Generated audio calls"
          icon={IconPhone}
          variant="primary"
        />
        <StatCard
          label="Delivered / Completed"
          value={completedCalls}
          subtext="Recipient answered"
          icon={IconCheckCircle}
          variant="success"
        />
        <StatCard
          label="Pending / Retrying"
          value={pendingOrFailed}
          subtext="In queue or retry state"
          icon={IconClock}
          variant={pendingOrFailed > 0 ? 'warning' : 'primary'}
        />
      </div>

      {/* Call History Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="card-title">Call Dispatch Records</h2>
            <p className="card-subtitle">Log of automated reminder calls generated by SmartFleet backend</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <IconSearch
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search phone, message..."
                className="form-control"
                style={{ paddingLeft: '32px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: '150px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="BUSY">BUSY</option>
              <option value="NO_ANSWER">NO_ANSWER</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        <div className="card-body">
          {filteredCalls.length === 0 ? (
            <EmptyState
              title={callLogs.length === 0 ? 'No voice call logs yet' : 'No matching call logs'}
              description={
                callLogs.length === 0
                  ? 'Dispatch a voice reminder for any active deadline or vehicle reminder to generate your first call record.'
                  : 'Try modifying your search or status filter.'
              }
              actionLabel={callLogs.length === 0 ? 'Dispatch Voice Reminder' : undefined}
              onAction={callLogs.length === 0 ? () => setIsModalOpen(true) : undefined}
              icon={IconPhone}
            />
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Dispatch Date & Time</th>
                    <th>Recipient Phone</th>
                    <th>Linked Reminder</th>
                    <th>Language</th>
                    <th>Transcribed Message</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCalls.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <strong>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent'}
                        </strong>
                      </td>
                      <td>
                        <code>{log.phoneNumber || '—'}</code>
                      </td>
                      <td>
                        {log.reminder ? (
                          <div>
                            <strong>{log.reminder.title}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Due: {log.reminder.reminderDate}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>General Alert</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-info">{log.language || 'ENGLISH'}</span>
                      </td>
                      <td>
                        <div
                          style={{
                            maxWidth: '260px',
                            fontSize: '0.84rem',
                            color: 'var(--text-main)',
                            lineHeight: 1.3,
                          }}
                        >
                          {log.message || 'Automated SmartFleet voice reminder alert'}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            log.callStatus === 'COMPLETED'
                              ? 'badge-success'
                              : log.callStatus === 'PENDING'
                              ? 'badge-warning'
                              : log.callStatus === 'BUSY'
                              ? 'badge-info'
                              : 'badge-danger'
                          }`}
                        >
                          {log.callStatus || 'PENDING'}
                        </span>
                      </td>
                      <td>
                        {log.callStatus !== 'COMPLETED' ? (
                          <button
                            onClick={() => handleUpdateStatus(log.id, 'COMPLETED')}
                            className="btn btn-outline"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.78rem',
                              color: 'var(--success-text)',
                            }}
                            title="Mark as Delivered / Completed"
                          >
                            <IconCheckCircle size={14} /> Completed
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(log.id, 'PENDING')}
                            className="btn btn-outline"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.78rem',
                            }}
                            title="Requeue Call"
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dispatch Call Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dispatch Voice Reminder Call"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-outline"
              disabled={triggering}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="trigger-call-form"
              className="btn btn-primary"
              disabled={triggering || reminders.length === 0}
            >
              {triggering ? 'Dispatching...' : 'Initiate Voice Call'}
            </button>
          </>
        }
      >
        <form id="trigger-call-form" onSubmit={handleTriggerCall}>
          <div className="form-group">
            <label className="form-label" htmlFor="remChoice">
              Select Reminder to Synthesize <span className="required">*</span>
            </label>
            {reminders.length === 0 ? (
              <div style={{ color: 'var(--danger-text)', fontSize: '0.88rem' }}>
                No reminders found. Create a reminder first in the Reminders section.
              </div>
            ) : (
              <select
                id="remChoice"
                className="form-select"
                value={selectedReminderId}
                onChange={(e) => setSelectedReminderId(e.target.value)}
                required
              >
                {reminders.map((r) => (
                  <option key={r.id} value={r.id}>
                    [{r.reminderType || 'ALERT'}] {r.title} — Due: {r.reminderDate} (Priority: {r.priority})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84rem',
              color: 'var(--text-muted)',
              marginTop: '12px',
            }}
          >
            The backend will synthesize speech for this reminder and dispatch an automated outbound phone call log
            according to your configured Voice Preferences.
          </div>
        </form>
      </Modal>
    </div>
  );
}

