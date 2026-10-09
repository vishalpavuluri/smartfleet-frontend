import React, { useState, useEffect } from 'react';
import {
  reminderAPI,
  vehicleAPI,
  getErrorMessage,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import {
  IconClock,
  IconPlus,
  IconSearch,
  IconCheckCircle,
  IconAlertTriangle,
  IconCar,
} from '../components/Icons';

export default function Reminders() {
  const toast = useToast();

  const [reminders, setReminders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    reminderType: 'SERVICE',
    reminderDate: new Date().toISOString().substring(0, 10),
    priority: 'NORMAL',
    status: 'PENDING',
    message: '',
    vehicleId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [remRes, vehRes] = await Promise.allSettled([
        reminderAPI.getAll(),
        vehicleAPI.getAll(),
      ]);

      if (remRes.status === 'fulfilled') setReminders(remRes.value.data || []);
      if (vehRes.status === 'fulfilled') setVehicles(vehRes.value.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch reminders'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a title for the reminder');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        reminderType: formData.reminderType,
        reminderDate: formData.reminderDate,
        priority: formData.priority,
        status: formData.status,
        message: formData.message.trim(),
        vehicle: formData.vehicleId ? { id: Number(formData.vehicleId) } : null,
      };

      await reminderAPI.create(payload);
      toast.success('Reminder scheduled successfully!');
      setIsModalOpen(false);
      setFormData({
        title: '',
        reminderType: 'SERVICE',
        reminderDate: new Date().toISOString().substring(0, 10),
        priority: 'NORMAL',
        status: 'PENDING',
        message: '',
        vehicleId: '',
      });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to schedule reminder'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async (id) => {
    try {
      await reminderAPI.complete(id);
      toast.success('Reminder marked as completed!');
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to complete reminder'));
    }
  };

  // Metrics
  const activeReminders = reminders.filter((r) => r.status !== 'COMPLETED');
  const urgentCount = activeReminders.filter((r) => r.priority === 'URGENT' || r.priority === 'HIGH').length;
  const completedCount = reminders.filter((r) => r.status === 'COMPLETED').length;

  // Filtered List
  const filteredReminders = reminders.filter((r) => {
    const searchMatch =
      !searchTerm ||
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reminderType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.vehicle?.vehicleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.vehicle?.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const priorityMatch = filterPriority === 'ALL' || r.priority === filterPriority;
    const statusMatch = filterStatus === 'ALL' || r.status === filterStatus;

    return searchMatch && priorityMatch && statusMatch;
  });

  if (loading) {
    return <Loader text="Loading fleet reminders & alerts..." />;
  }

  return (
    <div>
      <PageHeader
        title="Reminders & Maintenance Alerts"
        subtitle="Schedule automated vehicle alerts, insurance expiries, and service due dates"
        actions={
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <IconPlus size={16} /> Add Reminder
          </button>
        }
      />

      {/* Metrics */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard
          label="Pending Reminders"
          value={activeReminders.length}
          subtext="Requires attention"
          icon={IconClock}
          variant="primary"
        />
        <StatCard
          label="High / Urgent Priority"
          value={urgentCount}
          subtext="Critical deadlines"
          icon={IconAlertTriangle}
          variant={urgentCount > 0 ? 'danger' : 'success'}
        />
        <StatCard
          label="Resolved / Completed"
          value={completedCount}
          subtext="Past tasks fulfilled"
          icon={IconCheckCircle}
          variant="success"
        />
      </div>

      {/* List Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="card-title">All Scheduled Reminders</h2>
            <p className="card-subtitle">Manage upcoming operational alerts and tasks</p>
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
                placeholder="Search alerts..."
                className="form-control"
                style={{ paddingLeft: '32px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: '140px' }}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="ALL">All Priority</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
            </select>

            <select
              className="form-select"
              style={{ width: '150px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="DUE">Due</option>
              <option value="OVERDUE">Overdue</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="card-body">
          {filteredReminders.length === 0 ? (
            <EmptyState
              title={reminders.length === 0 ? 'No reminders created yet' : 'No matching reminders'}
              description={
                reminders.length === 0
                  ? 'Schedule service milestones, PUC renewals, or insurance expiry reminders to stay ahead.'
                  : 'Try modifying your search or priority filter.'
              }
              actionLabel={reminders.length === 0 ? 'Add Reminder' : undefined}
              onAction={reminders.length === 0 ? () => setIsModalOpen(true) : undefined}
            />
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Due Date</th>
                    <th>Title & Details</th>
                    <th>Type</th>
                    <th>Vehicle</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReminders.map((r) => {
                    const isCompleted = r.status === 'COMPLETED';
                    return (
                      <tr key={r.id} style={{ opacity: isCompleted ? 0.75 : 1 }}>
                        <td>
                          <strong>{r.reminderDate || '—'}</strong>
                        </td>
                        <td>
                          <div>
                            <strong style={{ fontSize: '0.92rem' }}>{r.title}</strong>
                            {r.message && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {r.message}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info">{r.reminderType || 'GENERAL'}</span>
                        </td>
                        <td>
                          {r.vehicle ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <IconCar size={14} style={{ color: 'var(--text-muted)' }} />
                              <span>{r.vehicle.vehicleName} ({r.vehicle.registrationNumber})</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>General Alert</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              r.priority === 'URGENT'
                                ? 'badge-danger'
                                : r.priority === 'HIGH'
                                ? 'badge-warning'
                                : 'badge-primary'
                            }`}
                          >
                            {r.priority || 'NORMAL'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              isCompleted
                                ? 'badge-success'
                                : r.status === 'OVERDUE'
                                ? 'badge-danger'
                                : r.status === 'DUE'
                                ? 'badge-warning'
                                : 'badge-info'
                            }`}
                          >
                            {r.status || 'PENDING'}
                          </span>
                        </td>
                        <td>
                          {!isCompleted ? (
                            <button
                              onClick={() => handleMarkComplete(r.id)}
                              className="btn btn-outline"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.78rem',
                                color: 'var(--success-text)',
                                borderColor: 'var(--success)',
                              }}
                              title="Mark task as finished"
                            >
                              <IconCheckCircle size={14} /> Done
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--success-text)', fontWeight: 600 }}>
                              ✓ Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Reminder Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule New Reminder"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-reminder-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Set Reminder'}
            </button>
          </>
        }
      >
        <form id="add-reminder-form" onSubmit={handleAddReminder}>
          <div className="form-group">
            <label className="form-label" htmlFor="remTitle">
              Reminder Title <span className="required">*</span>
            </label>
            <input
              id="remTitle"
              name="title"
              type="text"
              className="form-control"
              placeholder="e.g. Engine Oil Service or Insurance Expiry"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="remType">
                Category <span className="required">*</span>
              </label>
              <select
                id="remType"
                name="reminderType"
                className="form-select"
                value={formData.reminderType}
                onChange={handleInputChange}
                required
              >
                <option value="SERVICE">Service & Maintenance</option>
                <option value="INSURANCE">Insurance Renewal</option>
                <option value="PUC">PUC Emission Test</option>
                <option value="EMI">Finance EMI Due</option>
                <option value="PERMIT">Permit Renewal</option>
                <option value="FITNESS">Fitness Certificate</option>
                <option value="TAX">Road Tax Payment</option>
                <option value="GENERAL">General Operational Note</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="remDate">
                Due Date <span className="required">*</span>
              </label>
              <input
                id="remDate"
                name="reminderDate"
                type="date"
                className="form-control"
                value={formData.reminderDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="remVehicle">
                Assign Vehicle
              </label>
              <select
                id="remVehicle"
                name="vehicleId"
                className="form-select"
                value={formData.vehicleId}
                onChange={handleInputChange}
              >
                <option value="">-- General (No Vehicle) --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleName} ({v.registrationNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="remPriority">
                Priority Level <span className="required">*</span>
              </label>
              <select
                id="remPriority"
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleInputChange}
                required
              >
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="remMsg">
              Alert Details / Notes
            </label>
            <textarea
              id="remMsg"
              name="message"
              className="form-control"
              rows="3"
              placeholder="e.g. Authorized service station booking, replace brake pads and oil filter"
              value={formData.message}
              onChange={handleInputChange}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

