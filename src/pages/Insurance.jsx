import React, { useState, useEffect } from 'react';
import { insuranceAPI, vehicleAPI, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard, { formatCurrency } from '../components/StatCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { IconShield, IconPlus, IconAlertTriangle, IconDollar } from '../components/Icons';

export default function Insurance() {
  const toast = useToast();

  const [policies, setPolicies] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    provider: '',
    policyNumber: '',
    startDate: new Date().toISOString().substring(0, 10),
    expiryDate: '',
    premium: '',
    status: 'ACTIVE',
    vehicleId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [iRes, vRes] = await Promise.allSettled([
        insuranceAPI.getAll(),
        vehicleAPI.getAll(),
      ]);

      if (iRes.status === 'fulfilled') setPolicies(iRes.value.data || []);
      if (vRes.status === 'fulfilled') {
        const vList = vRes.value.data || [];
        setVehicles(vList);
        if (vList.length > 0 && !formData.vehicleId) {
          setFormData((prev) => ({ ...prev, vehicleId: String(vList[0].id) }));
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch insurance policies'));
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

  const handleAddInsurance = async (e) => {
    e.preventDefault();
    if (!formData.vehicleId) {
      toast.error('Please select a vehicle');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        provider: formData.provider.trim(),
        policyNumber: formData.policyNumber.trim(),
        startDate: formData.startDate,
        expiryDate: formData.expiryDate,
        premium: Number(formData.premium),
        status: formData.status,
        vehicle: { id: Number(formData.vehicleId) },
      };

      await insuranceAPI.create(payload);
      toast.success('Insurance policy registered successfully!');
      setIsModalOpen(false);
      setFormData({
        provider: '',
        policyNumber: '',
        startDate: new Date().toISOString().substring(0, 10),
        expiryDate: '',
        premium: '',
        status: 'ACTIVE',
        vehicleId: vehicles[0]?.id ? String(vehicles[0].id) : '',
      });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save insurance policy'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading vehicle insurance policies and renewal alerts..." />;
  }

  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const getExpiryDetails = (expiryStr) => {
    if (!expiryStr) return { status: 'UNKNOWN', label: 'No Expiry', color: 'badge-neutral' };
    const exp = new Date(expiryStr);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'EXPIRED', label: `Expired ${Math.abs(diffDays)}d ago`, color: 'badge-danger' };
    }
    if (diffDays <= 30) {
      return { status: 'EXPIRING_SOON', label: `Expires in ${diffDays}d`, color: 'badge-warning' };
    }
    return { status: 'ACTIVE', label: `${diffDays} days left`, color: 'badge-success' };
  };

  const expiringSoonCount = policies.filter((p) => {
    const detail = getExpiryDetails(p.expiryDate);
    return detail.status === 'EXPIRING_SOON';
  }).length;

  const expiredCount = policies.filter((p) => {
    const detail = getExpiryDetails(p.expiryDate);
    return detail.status === 'EXPIRED';
  }).length;

  const totalPremium = policies.reduce((sum, p) => sum + (p.premium || 0), 0);

  return (
    <div>
      <PageHeader
        title="Insurance Policy Management"
        subtitle="Manage comprehensive vehicle insurance, track policy expiries, and prevent renewal lapses"
        actions={
          <button
            onClick={() => {
              if (vehicles.length === 0) {
                toast.warning('Please add a vehicle first');
                return;
              }
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <IconPlus size={16} />
            <span>Add Policy</span>
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Policies"
          value={policies.length}
          subtitle="Registered coverages"
          icon={IconShield}
          color="blue"
        />

        <StatCard
          title="Expiring Within 30 Days"
          value={expiringSoonCount}
          subtitle="Immediate renewal required"
          icon={IconAlertTriangle}
          color={expiringSoonCount > 0 ? 'amber' : 'green'}
        />

        <StatCard
          title="Expired Policies"
          value={expiredCount}
          subtitle="Lapsed vehicle policies"
          icon={IconAlertTriangle}
          color={expiredCount > 0 ? 'red' : 'green'}
        />

        <StatCard
          title="Total Annual Premium"
          value={totalPremium}
          subtitle="Annual insurance premium sum"
          icon={IconDollar}
          color="teal"
          isCurrency
        />
      </div>

      {/* Policies Table */}
      <div className="sf-card">
        <div className="sf-card-header">
          <h3 className="sf-card-title">
            <IconShield size={18} />
            <span>Registered Insurance Policies</span>
          </h3>
        </div>
        <div className="sf-card-body" style={{ padding: 0 }}>
          {policies.length === 0 ? (
            <EmptyState
              title="No insurance policies on record"
              description="Protect your fleet against unforeseen damages and traffic challans by registering your insurance policies."
              actionLabel="Add Insurance Policy"
              onAction={() => setIsModalOpen(true)}
              icon={IconShield}
            />
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Insurance Provider</th>
                    <th>Policy Number</th>
                    <th>Start Date</th>
                    <th>Expiry Date</th>
                    <th>Renewal Status</th>
                    <th>Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((p) => {
                    const expiry = getExpiryDetails(p.expiryDate);
                    return (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.vehicle?.vehicleName || 'Vehicle'}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {p.vehicle?.registrationNumber}
                          </div>
                        </td>
                        <td><strong>{p.provider}</strong></td>
                        <td>
                          <code>{p.policyNumber}</code>
                        </td>
                        <td>{p.startDate || '—'}</td>
                        <td>
                          <strong>{p.expiryDate}</strong>
                        </td>
                        <td>
                          <span className={`badge ${expiry.color}`}>{expiry.label}</span>
                        </td>
                        <td>
                          <strong>{formatCurrency(p.premium)}</strong>
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

      {/* Add Insurance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Vehicle Insurance Policy"
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
              form="add-insurance-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Register Policy'}
            </button>
          </>
        }
      >
        <form id="add-insurance-form" onSubmit={handleAddInsurance}>
          <div className="form-group">
            <label className="form-label" htmlFor="insVehicleId">
              Select Vehicle <span className="required">*</span>
            </label>
            <select
              id="insVehicleId"
              name="vehicleId"
              className="form-select"
              value={formData.vehicleId}
              onChange={handleInputChange}
              required
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicleName} - {v.registrationNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="provider">
                Insurance Provider <span className="required">*</span>
              </label>
              <input
                id="provider"
                name="provider"
                type="text"
                className="form-control"
                placeholder="e.g. ICICI Lombard, Tata AIG, HDFC ERGO"
                value={formData.provider}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="policyNumber">
                Policy Number <span className="required">*</span>
              </label>
              <input
                id="policyNumber"
                name="policyNumber"
                type="text"
                className="form-control"
                placeholder="e.g. POL-98234-2026"
                value={formData.policyNumber}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="startDate">
                Start Date <span className="required">*</span>
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className="form-control"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expiryDate">
                Expiry Date <span className="required">*</span>
              </label>
              <input
                id="expiryDate"
                name="expiryDate"
                type="date"
                className="form-control"
                value={formData.expiryDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="premium">
                Annual Premium (₹) <span className="required">*</span>
              </label>
              <input
                id="premium"
                name="premium"
                type="number"
                min="0"
                step="any"
                className="form-control"
                placeholder="e.g. 18500"
                value={formData.premium}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="status">
                Policy Status
              </label>
              <select
                id="status"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="EXPIRING">EXPIRING</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

