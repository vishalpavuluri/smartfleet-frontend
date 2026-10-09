import React, { useState, useEffect } from 'react';
import { documentAPI, vehicleAPI, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import {
  IconFileText,
  IconPlus,
  IconAlertTriangle,
  IconCheckCircle,
} from '../components/Icons';

export default function Documents() {
  const toast = useToast();

  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    documentType: 'RC',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    status: 'VALID',
    documentUrl: '',
    vehicleId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dRes, vRes] = await Promise.allSettled([
        documentAPI.getAll(),
        vehicleAPI.getAll(),
      ]);

      if (dRes.status === 'fulfilled') setDocuments(dRes.value.data || []);
      if (vRes.status === 'fulfilled') {
        const vList = vRes.value.data || [];
        setVehicles(vList);
        if (vList.length > 0 && !formData.vehicleId) {
          setFormData((prev) => ({ ...prev, vehicleId: String(vList[0].id) }));
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch vehicle documents'));
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

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!formData.vehicleId) {
      toast.error('Please select a vehicle');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        documentType: formData.documentType,
        documentNumber: formData.documentNumber.trim(),
        issueDate: formData.issueDate || null,
        expiryDate: formData.expiryDate || null,
        status: formData.status,
        documentUrl: formData.documentUrl.trim(),
        vehicle: { id: Number(formData.vehicleId) },
      };

      await documentAPI.create(payload);
      toast.success('Document registered successfully!');
      setIsModalOpen(false);
      setFormData({
        documentType: 'RC',
        documentNumber: '',
        issueDate: '',
        expiryDate: '',
        status: 'VALID',
        documentUrl: '',
        vehicleId: vehicles[0]?.id ? String(vehicles[0].id) : '',
      });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save vehicle document'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading vehicle documents & compliance records..." />;
  }

  const today = new Date();
  const getDocExpiryBadge = (expiryStr) => {
    if (!expiryStr) return { label: 'No Expiry', color: 'badge-neutral' };
    const exp = new Date(expiryStr);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Expired (${Math.abs(diffDays)}d ago)`, color: 'badge-danger' };
    }
    if (diffDays <= 30) {
      return { label: `Expiring Soon (${diffDays}d)`, color: 'badge-warning' };
    }
    return { label: `Valid (${diffDays}d left)`, color: 'badge-success' };
  };

  const expiringSoonCount = documents.filter((d) => {
    if (!d.expiryDate) return false;
    const exp = new Date(d.expiryDate);
    const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  }).length;

  const expiredCount = documents.filter((d) => {
    if (!d.expiryDate) return false;
    return new Date(d.expiryDate) < today;
  }).length;

  return (
    <div>
      <PageHeader
        title="Vehicle Documents & Compliance"
        subtitle="Manage RC books, Pollution Under Control (PUC), Fitness Certificates, and Road Permits"
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
            <span>Add Document</span>
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Documents"
          value={documents.length}
          subtitle="Registered certificates"
          icon={IconFileText}
          color="blue"
        />

        <StatCard
          title="Expiring Soon (30d)"
          value={expiringSoonCount}
          subtitle="Needs renewal soon"
          icon={IconAlertTriangle}
          color={expiringSoonCount > 0 ? 'amber' : 'green'}
        />

        <StatCard
          title="Expired Documents"
          value={expiredCount}
          subtitle="Non-compliant items"
          icon={IconAlertTriangle}
          color={expiredCount > 0 ? 'red' : 'green'}
        />

        <StatCard
          title="Valid & Compliant"
          value={documents.length - expiredCount - expiringSoonCount}
          subtitle="Active legal compliance"
          icon={IconCheckCircle}
          color="green"
        />
      </div>

      {/* Documents Table */}
      <div className="sf-card">
        <div className="sf-card-header">
          <h3 className="sf-card-title">
            <IconFileText size={18} />
            <span>All Compliance Documents</span>
          </h3>
        </div>
        <div className="sf-card-body" style={{ padding: 0 }}>
          {documents.length === 0 ? (
            <EmptyState
              title="No documents uploaded yet"
              description="Keep vehicle documents digitized and avoid traffic penalties by tracking RC, PUC, and Permits."
              actionLabel="Add Document"
              onAction={() => setIsModalOpen(true)}
              icon={IconFileText}
            />
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Document Type</th>
                    <th>Document Number</th>
                    <th>Issue Date</th>
                    <th>Expiry Date</th>
                    <th>Compliance Status</th>
                    <th>Document URL</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => {
                    const badge = getDocExpiryBadge(d.expiryDate);
                    return (
                      <tr key={d.id}>
                        <td>
                          <strong>{d.vehicle?.vehicleName || 'Vehicle'}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {d.vehicle?.registrationNumber}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-primary">{d.documentType}</span>
                        </td>
                        <td>
                          <code>{d.documentNumber}</code>
                        </td>
                        <td>{d.issueDate || '—'}</td>
                        <td>
                          <strong>{d.expiryDate || 'Lifetime / No Expiry'}</strong>
                        </td>
                        <td>
                          <span className={`badge ${badge.color}`}>{badge.label}</span>
                        </td>
                        <td>
                          {d.documentUrl ? (
                            <a
                              href={d.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                            >
                              View File
                            </a>
                          ) : (
                            '—'
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

      {/* Add Document Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Vehicle Document"
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
              form="add-doc-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Document'}
            </button>
          </>
        }
      >
        <form id="add-doc-form" onSubmit={handleAddDocument}>
          <div className="form-group">
            <label className="form-label" htmlFor="docVehicleId">
              Select Vehicle <span className="required">*</span>
            </label>
            <select
              id="docVehicleId"
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
              <label className="form-label" htmlFor="documentType">
                Document Type <span className="required">*</span>
              </label>
              <select
                id="documentType"
                name="documentType"
                className="form-select"
                value={formData.documentType}
                onChange={handleInputChange}
                required
              >
                <option value="RC">RC (Registration Certificate)</option>
                <option value="PUC">PUC (Pollution Certificate)</option>
                <option value="Fitness">Fitness Certificate</option>
                <option value="Permit">National / State Permit</option>
                <option value="Insurance">Insurance Copy</option>
                <option value="Road Tax">Road Tax Token</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="documentNumber">
                Document Number <span className="required">*</span>
              </label>
              <input
                id="documentNumber"
                name="documentNumber"
                type="text"
                className="form-control"
                placeholder="e.g. PUC9823487 or RC Number"
                value={formData.documentNumber}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="issueDate">
                Issue Date
              </label>
              <input
                id="issueDate"
                name="issueDate"
                type="date"
                className="form-control"
                value={formData.issueDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expiryDate">
                Expiry Date
              </label>
              <input
                id="expiryDate"
                name="expiryDate"
                type="date"
                className="form-control"
                value={formData.expiryDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="documentUrl">
              Document Cloud URL / Scan Link
            </label>
            <input
              id="documentUrl"
              name="documentUrl"
              type="url"
              className="form-control"
              placeholder="e.g. https://drive.google.com/file/..."
              value={formData.documentUrl}
              onChange={handleInputChange}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

