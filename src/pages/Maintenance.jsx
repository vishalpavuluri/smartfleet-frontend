import React, { useState, useEffect } from 'react';
import { maintenanceAPI, vehicleAPI, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard, { formatCurrency } from '../components/StatCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { IconTool, IconPlus, IconClock, IconDollar } from '../components/Icons';

export default function Maintenance() {
  const toast = useToast();

  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    serviceDate: new Date().toISOString().substring(0, 10),
    nextServiceDate: '',
    serviceKm: '',
    nextServiceKm: '',
    serviceCost: '',
    serviceType: 'Regular Service',
    partsReplaced: '',
    remarks: '',
    vehicleId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, vRes] = await Promise.allSettled([
        maintenanceAPI.getAll(),
        vehicleAPI.getAll(),
      ]);

      if (mRes.status === 'fulfilled') setRecords(mRes.value.data || []);
      if (vRes.status === 'fulfilled') {
        const vList = vRes.value.data || [];
        setVehicles(vList);
        if (vList.length > 0 && !formData.vehicleId) {
          setFormData((prev) => ({ ...prev, vehicleId: String(vList[0].id) }));
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch maintenance records'));
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

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!formData.vehicleId) {
      toast.error('Please select a vehicle');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        serviceDate: formData.serviceDate,
        nextServiceDate: formData.nextServiceDate || null,
        serviceKm: formData.serviceKm ? Number(formData.serviceKm) : null,
        nextServiceKm: formData.nextServiceKm ? Number(formData.nextServiceKm) : null,
        serviceCost: formData.serviceCost ? Number(formData.serviceCost) : 0,
        serviceType: formData.serviceType,
        partsReplaced: formData.partsReplaced.trim(),
        remarks: formData.remarks.trim(),
        vehicle: { id: Number(formData.vehicleId) },
      };

      await maintenanceAPI.create(payload);
      toast.success('Maintenance record logged successfully!');
      setIsModalOpen(false);
      setFormData({
        serviceDate: new Date().toISOString().substring(0, 10),
        nextServiceDate: '',
        serviceKm: '',
        nextServiceKm: '',
        serviceCost: '',
        serviceType: 'Regular Service',
        partsReplaced: '',
        remarks: '',
        vehicleId: vehicles[0]?.id ? String(vehicles[0].id) : '',
      });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save maintenance record'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading vehicle maintenance and service schedules..." />;
  }

  const totalSpent = records.reduce((sum, r) => sum + (r.serviceCost || 0), 0);

  const today = new Date();
  const upcomingList = records.filter((r) => {
    if (!r.nextServiceDate) return false;
    return new Date(r.nextServiceDate) >= today;
  });

  return (
    <div>
      <PageHeader
        title="Maintenance & Service Logs"
        subtitle="Manage routine servicing, parts replaced, workshop costs, and upcoming intervals"
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
            <span>Log Service</span>
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Service Logs"
          value={records.length}
          subtitle="Workshops visits logged"
          icon={IconTool}
          color="blue"
        />

        <StatCard
          title="Upcoming Services"
          value={upcomingList.length}
          subtitle="Scheduled future services"
          icon={IconClock}
          color={upcomingList.length > 0 ? 'amber' : 'green'}
        />

        <StatCard
          title="Total Maintenance Spent"
          value={totalSpent}
          subtitle="Lifetime service expenditure"
          icon={IconDollar}
          color="teal"
          isCurrency
        />
      </div>

      {/* Records Table */}
      <div className="sf-card">
        <div className="sf-card-header">
          <h3 className="sf-card-title">
            <IconTool size={18} />
            <span>Service History</span>
          </h3>
        </div>
        <div className="sf-card-body" style={{ padding: 0 }}>
          {records.length === 0 ? (
            <EmptyState
              title="No maintenance records yet"
              description="Keep your vehicles healthy by logging periodic oil changes, inspections, and repairs."
              actionLabel="Log First Service"
              onAction={() => setIsModalOpen(true)}
              icon={IconTool}
            />
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>Service Date</th>
                    <th>Vehicle</th>
                    <th>Service Type</th>
                    <th>Odometer (KM)</th>
                    <th>Cost</th>
                    <th>Next Due</th>
                    <th>Parts / Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.serviceDate}</strong></td>
                      <td>
                        <strong>{r.vehicle?.vehicleName || 'Vehicle'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {r.vehicle?.registrationNumber}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">{r.serviceType || 'General'}</span>
                      </td>
                      <td>{r.serviceKm ? `${Number(r.serviceKm).toLocaleString()} km` : '—'}</td>
                      <td><strong>{formatCurrency(r.serviceCost)}</strong></td>
                      <td>
                        {r.nextServiceDate ? (
                          <div>
                            <strong>{r.nextServiceDate}</strong>
                            {r.nextServiceKm && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                At {Number(r.nextServiceKm).toLocaleString()} km
                              </div>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {r.partsReplaced && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                            <strong>Parts:</strong> {r.partsReplaced}
                          </div>
                        )}
                        {r.remarks && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {r.remarks}
                          </div>
                        )}
                        {!r.partsReplaced && !r.remarks && '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Maintenance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Vehicle Maintenance / Service"
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
              form="add-service-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Record Service'}
            </button>
          </>
        }
      >
        <form id="add-service-form" onSubmit={handleAddService}>
          <div className="form-group">
            <label className="form-label" htmlFor="maintVehicleId">
              Select Vehicle <span className="required">*</span>
            </label>
            <select
              id="maintVehicleId"
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
              <label className="form-label" htmlFor="serviceDate">
                Service Date <span className="required">*</span>
              </label>
              <input
                id="serviceDate"
                name="serviceDate"
                type="date"
                className="form-control"
                value={formData.serviceDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="serviceType">
                Service Type <span className="required">*</span>
              </label>
              <select
                id="serviceType"
                name="serviceType"
                className="form-select"
                value={formData.serviceType}
                onChange={handleInputChange}
                required
              >
                <option value="Regular Service">Regular Service</option>
                <option value="Oil & Filter Change">Oil & Filter Change</option>
                <option value="Brake System">Brake System</option>
                <option value="Tire & Wheel Alignment">Tire & Wheel Alignment</option>
                <option value="Battery / Electrical">Battery / Electrical</option>
                <option value="Suspension / Steering">Suspension / Steering</option>
                <option value="Major Overhaul">Major Overhaul</option>
                <option value="Accidental Repair">Accidental Repair</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="serviceKm">
                Service Odometer (KM)
              </label>
              <input
                id="serviceKm"
                name="serviceKm"
                type="number"
                min="0"
                step="any"
                className="form-control"
                placeholder="e.g. 15000"
                value={formData.serviceKm}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="serviceCost">
                Service Cost (₹) <span className="required">*</span>
              </label>
              <input
                id="serviceCost"
                name="serviceCost"
                type="number"
                min="0"
                step="any"
                className="form-control"
                placeholder="e.g. 4500"
                value={formData.serviceCost}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="nextServiceDate">
                Next Service Date
              </label>
              <input
                id="nextServiceDate"
                name="nextServiceDate"
                type="date"
                className="form-control"
                value={formData.nextServiceDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="nextServiceKm">
                Next Service KM
              </label>
              <input
                id="nextServiceKm"
                name="nextServiceKm"
                type="number"
                min="0"
                step="any"
                className="form-control"
                placeholder="e.g. 25000"
                value={formData.nextServiceKm}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="partsReplaced">
              Parts Replaced
            </label>
            <input
              id="partsReplaced"
              name="partsReplaced"
              type="text"
              className="form-control"
              placeholder="e.g. Engine oil 5W30, Oil filter, Brake pads"
              value={formData.partsReplaced}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="remarks">
              Workshop / Mechanic Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              rows="2"
              className="form-control"
              placeholder="e.g. Front tires need replacement in 5,000 km"
              value={formData.remarks}
              onChange={handleInputChange}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

