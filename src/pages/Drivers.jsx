import React, { useState, useEffect } from 'react';
import { driverAPI, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard, { formatCurrency } from '../components/StatCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import {
  IconUsers,
  IconPlus,
  IconSearch,
  IconAlertTriangle,
  IconCheckCircle,
} from '../components/Icons';

export default function Drivers() {
  const toast = useToast();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    address: '',
    status: 'ACTIVE',
    salary: '',
  });

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await driverAPI.getAll();
      setDrivers(res.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch driver records'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      toast.error('Driver mobile number must be 10 digits');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        licenseNumber: formData.licenseNumber.trim().toUpperCase(),
        licenseExpiryDate: formData.licenseExpiryDate || null,
        address: formData.address.trim(),
        status: formData.status,
        salary: formData.salary ? Number(formData.salary) : 0,
      };

      await driverAPI.create(payload);
      toast.success('Driver registered successfully!');
      setIsModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        licenseNumber: '',
        licenseExpiryDate: '',
        address: '',
        status: 'ACTIVE',
        salary: '',
      });
      fetchDrivers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save driver'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading transport drivers..." />;
  }

  const today = new Date();
  const getLicenseExpiryInfo = (expiryStr) => {
    if (!expiryStr) return { label: 'No Expiry', color: 'badge-neutral' };
    const exp = new Date(expiryStr);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Expired ${Math.abs(diffDays)}d ago`, color: 'badge-danger' };
    }
    if (diffDays <= 30) {
      return { label: `Expires in ${diffDays}d`, color: 'badge-warning' };
    }
    return { label: `Valid (${diffDays}d left)`, color: 'badge-success' };
  };

  const expiringLicenses = drivers.filter((d) => {
    if (!d.licenseExpiryDate) return false;
    const exp = new Date(d.licenseExpiryDate);
    const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  });

  const activeDrivers = drivers.filter((d) => d.status === 'ACTIVE');
  const totalSalaries = drivers.reduce((sum, d) => sum + (d.salary || 0), 0);

  const filteredDrivers = drivers.filter((d) => {
    const term = searchTerm.toLowerCase();
    return (
      d.name?.toLowerCase().includes(term) ||
      d.phone?.includes(term) ||
      d.licenseNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <PageHeader
        title="Drivers Roster"
        subtitle="Manage commercial drivers, commercial licenses, contact details, and monthly payrolls"
        actions={
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <IconPlus size={16} />
            <span>Add Driver</span>
          </button>
        }
      />

      {/* Stats Summary */}
      <div className="stats-grid">
        <StatCard
          title="Total Drivers"
          value={drivers.length}
          subtitle="Enrolled staff"
          icon={IconUsers}
          color="blue"
        />

        <StatCard
          title="Active On Duty"
          value={activeDrivers.length}
          subtitle="Available for dispatch"
          icon={IconCheckCircle}
          color="green"
        />

        <StatCard
          title="License Expiring Soon"
          value={expiringLicenses.length}
          subtitle="Renewal required in 30 days"
          icon={IconAlertTriangle}
          color={expiringLicenses.length > 0 ? 'amber' : 'green'}
        />

        <StatCard
          title="Monthly Payroll"
          value={totalSalaries}
          subtitle="Fixed driver salaries sum"
          icon={IconUsers}
          color="teal"
          isCurrency
        />
      </div>

      {/* Search Bar */}
      <div className="search-bar-wrap">
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by driver name, phone, or license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '34px' }}
          />
          <span
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-subtle)',
            }}
          >
            <IconSearch size={16} />
          </span>
        </div>
      </div>

      {/* Driver List Table */}
      <div className="sf-card">
        <div className="sf-card-header">
          <h3 className="sf-card-title">
            <IconUsers size={18} />
            <span>Driver Directory</span>
          </h3>
        </div>
        <div className="sf-card-body" style={{ padding: 0 }}>
          {filteredDrivers.length === 0 ? (
            <EmptyState
              title={searchTerm ? 'No drivers matching criteria' : 'No drivers registered yet'}
              description={
                searchTerm
                  ? 'Try a different search query.'
                  : 'Enroll your drivers to assign them to commercial freight and passenger trips.'
              }
              actionLabel="Add Driver"
              onAction={() => setIsModalOpen(true)}
              icon={IconUsers}
            />
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>Driver Name</th>
                    <th>Phone Number</th>
                    <th>License Number</th>
                    <th>License Expiry</th>
                    <th>Salary</th>
                    <th>Status</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((d) => {
                    const licInfo = getLicenseExpiryInfo(d.licenseExpiryDate);
                    return (
                      <tr key={d.id}>
                        <td>
                          <strong>{d.name}</strong>
                        </td>
                        <td>
                          <a
                            href={`tel:${d.phone}`}
                            style={{ color: 'var(--primary)', fontWeight: 600 }}
                          >
                            {d.phone}
                          </a>
                        </td>
                        <td>
                          <code>{d.licenseNumber}</code>
                        </td>
                        <td>
                          <div>{d.licenseExpiryDate || '—'}</div>
                          <span className={`badge ${licInfo.color}`} style={{ marginTop: '2px' }}>
                            {licInfo.label}
                          </span>
                        </td>
                        <td>
                          <strong>{formatCurrency(d.salary)}</strong>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              d.status === 'ACTIVE'
                                ? 'badge-success'
                                : d.status === 'ON TRIP'
                                ? 'badge-info'
                                : 'badge-neutral'
                            }`}
                          >
                            {d.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {d.address || '—'}
                          </span>
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

      {/* Add Driver Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Driver to Roster"
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
              form="add-driver-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Add Driver'}
            </button>
          </>
        }
      >
        <form id="add-driver-form" onSubmit={handleAddDriver}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="driverName">
                Driver Full Name <span className="required">*</span>
              </label>
              <input
                id="driverName"
                name="name"
                type="text"
                className="form-control"
                placeholder="e.g. Raju Yadav"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="driverPhone">
                Mobile Number (10 digits) <span className="required">*</span>
              </label>
              <input
                id="driverPhone"
                name="phone"
                type="tel"
                maxLength="10"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="licenseNumber">
                Driving License Number <span className="required">*</span>
              </label>
              <input
                id="licenseNumber"
                name="licenseNumber"
                type="text"
                className="form-control"
                placeholder="e.g. TS0920200004521"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="licenseExpiryDate">
                License Expiry Date
              </label>
              <input
                id="licenseExpiryDate"
                name="licenseExpiryDate"
                type="date"
                className="form-control"
                value={formData.licenseExpiryDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="salary">
                Monthly Salary (₹)
              </label>
              <input
                id="salary"
                name="salary"
                type="number"
                min="0"
                step="any"
                className="form-control"
                placeholder="e.g. 22000"
                value={formData.salary}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="driverStatus">
                Current Status
              </label>
              <select
                id="driverStatus"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON TRIP">ON TRIP</option>
                <option value="ON LEAVE">ON LEAVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="driverAddress">
              Residential Address
            </label>
            <textarea
              id="driverAddress"
              name="address"
              rows="2"
              className="form-control"
              placeholder="e.g. Plot 45, Auto Nagar, Hyderabad"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

