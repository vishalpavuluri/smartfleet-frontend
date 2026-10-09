import React, { useState, useEffect } from 'react';
import {
  tripAPI,
  vehicleAPI,
  driverAPI,
  customerAPI,
  getErrorMessage,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard, { formatCurrency } from '../components/StatCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  IconMapPin,
  IconPlus,
  IconDollar,
  IconCheckCircle,
  IconTrendingUp,
  IconSearch,
} from '../components/Icons';

export default function Trips() {
  const toast = useToast();

  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Complete Trip Dialog
  const [completeTripId, setCompleteTripId] = useState(null);
  const [completing, setCompleting] = useState(false);

  // Dynamic Trip Form
  const [formData, setFormData] = useState({
    tripType: 'GOODS', // GOODS | PASSENGER | TAXI | CONTRACT
    pickupLocation: '',
    dropLocation: '',
    tripDate: new Date().toISOString().substring(0, 10),
    totalFreight: '',
    amountReceived: '',
    status: 'ONGOING',

    // Specific to GOODS
    loadType: 'General Cargo',
    quantity: '',
    unit: 'Tons',
    rate: '',

    // Specific to PASSENGER / TAXI
    passengerCount: '4',

    // Relations
    vehicleId: '',
    driverId: '',
    customerId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, vRes, dRes, cRes] = await Promise.allSettled([
        tripAPI.getAll(),
        vehicleAPI.getAll(),
        driverAPI.getAll(),
        customerAPI.getAll(),
      ]);

      if (tRes.status === 'fulfilled') setTrips(tRes.value.data || []);
      if (vRes.status === 'fulfilled') {
        const vList = vRes.value.data || [];
        setVehicles(vList);
        if (vList.length > 0 && !formData.vehicleId) {
          setFormData((prev) => ({ ...prev, vehicleId: String(vList[0].id) }));
        }
      }
      if (dRes.status === 'fulfilled') {
        const dList = dRes.value.data || [];
        setDrivers(dList);
        if (dList.length > 0 && !formData.driverId) {
          setFormData((prev) => ({ ...prev, driverId: String(dList[0].id) }));
        }
      }
      if (cRes.status === 'fulfilled') {
        const cList = cRes.value.data || [];
        setCustomers(cList);
        if (cList.length > 0 && !formData.customerId) {
          setFormData((prev) => ({ ...prev, customerId: String(cList[0].id) }));
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch trip logs'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate totalFreight for GOODS if quantity and rate are entered
      if (prev.tripType === 'GOODS') {
        if (name === 'quantity' && prev.rate) {
          updated.totalFreight = String(Number(value) * Number(prev.rate));
        } else if (name === 'rate' && prev.quantity) {
          updated.totalFreight = String(Number(prev.quantity) * Number(value));
        }
      }

      return updated;
    });
  };

  const handleAddTrip = async (e) => {
    e.preventDefault();
    if (!formData.vehicleId) {
      toast.error('Please assign a vehicle');
      return;
    }

    try {
      setSubmitting(true);
      const freightVal = Number(formData.totalFreight || 0);
      const recVal = Number(formData.amountReceived || 0);

      const payload = {
        tripType: formData.tripType,
        pickupLocation: formData.pickupLocation.trim(),
        dropLocation: formData.dropLocation.trim(),
        tripDate: formData.tripDate,
        totalFreight: freightVal,
        amountReceived: recVal,
        pendingAmount: Math.max(0, freightVal - recVal),
        status: formData.status,

        loadType: formData.tripType === 'GOODS' ? formData.loadType : null,
        quantity: formData.tripType === 'GOODS' && formData.quantity ? Number(formData.quantity) : null,
        unit: formData.tripType === 'GOODS' ? formData.unit : null,
        rate: formData.tripType === 'GOODS' && formData.rate ? Number(formData.rate) : null,

        passengerCount:
          formData.tripType === 'PASSENGER' || formData.tripType === 'TAXI'
            ? Number(formData.passengerCount || 1)
            : null,

        vehicle: { id: Number(formData.vehicleId) },
        driver: formData.driverId ? { id: Number(formData.driverId) } : null,
        customer: formData.customerId ? { id: Number(formData.customerId) } : null,
      };

      await tripAPI.create(payload);
      toast.success('Trip created and dispatched successfully!');
      setIsModalOpen(false);
      setFormData({
        tripType: 'GOODS',
        pickupLocation: '',
        dropLocation: '',
        tripDate: new Date().toISOString().substring(0, 10),
        totalFreight: '',
        amountReceived: '',
        status: 'ONGOING',
        loadType: 'General Cargo',
        quantity: '',
        unit: 'Tons',
        rate: '',
        passengerCount: '4',
        vehicleId: vehicles[0]?.id ? String(vehicles[0].id) : '',
        driverId: drivers[0]?.id ? String(drivers[0].id) : '',
        customerId: customers[0]?.id ? String(customers[0].id) : '',
      });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create trip'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!completeTripId) return;
    try {
      setCompleting(true);
      await tripAPI.complete(completeTripId);
      toast.success('Trip completed! Net profit and final expenses computed.');
      setCompleteTripId(null);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not complete trip'));
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading transport trips and freight manifests..." />;
  }

  const ongoingCount = trips.filter((t) => t.status === 'ONGOING').length;
  const completedTrips = trips.filter((t) => t.status === 'COMPLETED');
  const totalRevenue = trips.reduce((sum, t) => sum + (t.totalFreight || 0), 0);
  const totalTripProfits = completedTrips.reduce((sum, t) => sum + (t.tripProfit || 0), 0);

  const filteredTrips = trips.filter((t) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      t.pickupLocation?.toLowerCase().includes(term) ||
      t.dropLocation?.toLowerCase().includes(term) ||
      t.vehicle?.vehicleName?.toLowerCase().includes(term) ||
      t.driver?.name?.toLowerCase().includes(term) ||
      t.customer?.name?.toLowerCase().includes(term);

    const matchType = filterType === 'ALL' || t.tripType === filterType;
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;

    return matchSearch && matchType && matchStatus;
  });

  return (
    <div>
      <PageHeader
        title="Trips & Dispatch Manifests"
        subtitle="Manage commercial freight, passenger routes, contractor billing, and voyage profitability"
        actions={
          <button
            onClick={() => {
              if (vehicles.length === 0) {
                toast.warning('Please add at least one vehicle to your fleet first');
                return;
              }
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <IconPlus size={16} />
            <span>Create Trip</span>
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Trips"
          value={trips.length}
          subtitle="All logged dispatches"
          icon={IconMapPin}
          color="blue"
        />

        <StatCard
          title="Ongoing In-Transit"
          value={ongoingCount}
          subtitle="Vehicles currently running"
          icon={IconMapPin}
          color="amber"
        />

        <StatCard
          title="Total Freight Value"
          value={totalRevenue}
          subtitle="Gross booked revenue"
          icon={IconDollar}
          color="teal"
          isCurrency
        />

        <StatCard
          title="Completed Trips Profit"
          value={totalTripProfits}
          subtitle={`${completedTrips.length} finished trips`}
          icon={IconTrendingUp}
          color="green"
          isCurrency
        />
      </div>

      {/* Search and Filters */}
      <div className="search-bar-wrap">
        <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by route, driver, vehicle, customer..."
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

        <select
          className="form-select"
          style={{ width: '160px' }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ALL">All Trip Types</option>
          <option value="GOODS">GOODS (Freight)</option>
          <option value="PASSENGER">PASSENGER</option>
          <option value="TAXI">TAXI</option>
          <option value="CONTRACT">CONTRACT</option>
        </select>

        <select
          className="form-select"
          style={{ width: '160px' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="ONGOING">ONGOING</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Trips Table */}
      <div className="sf-card">
        <div className="sf-card-header">
          <h3 className="sf-card-title">
            <IconMapPin size={18} />
            <span>Trip Dispatches ({filteredTrips.length})</span>
          </h3>
        </div>
        <div className="sf-card-body" style={{ padding: 0 }}>
          {filteredTrips.length === 0 ? (
            <EmptyState
              title={searchTerm ? 'No trips matching filters' : 'No trips dispatched yet'}
              description={
                searchTerm
                  ? 'Try clearing your filters.'
                  : 'Start by dispatching your first freight or passenger trip.'
              }
              actionLabel="Create Trip"
              onAction={() => setIsModalOpen(true)}
              icon={IconMapPin}
            />
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>Date & Type</th>
                    <th>Route (From &rarr; To)</th>
                    <th>Vehicle & Driver</th>
                    <th>Customer</th>
                    <th>Total Freight</th>
                    <th>Received / Due</th>
                    <th>Expenses & Profit</th>
                    <th>Status / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <strong>{t.tripDate}</strong>
                        <div>
                          <span
                            className={`badge ${
                              t.tripType === 'GOODS'
                                ? 'badge-primary'
                                : t.tripType === 'CONTRACT'
                                ? 'badge-info'
                                : 'badge-neutral'
                            }`}
                            style={{ fontSize: '0.72rem', marginTop: '2px' }}
                          >
                            {t.tripType}
                          </span>
                        </div>
                      </td>

                      <td>
                        <strong>{t.pickupLocation}</strong>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          &darr; to
                        </div>
                        <strong>{t.dropLocation}</strong>
                        {t.tripType === 'GOODS' && t.loadType && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                            Load: {t.loadType} {t.quantity ? `(${t.quantity} ${t.unit})` : ''}
                          </div>
                        )}
                        {(t.tripType === 'PASSENGER' || t.tripType === 'TAXI') && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                            Pax: {t.passengerCount || 1} Persons
                          </div>
                        )}
                      </td>

                      <td>
                        <strong>{t.vehicle?.vehicleName || '—'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {t.vehicle?.registrationNumber}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '2px' }}>
                          Driver: {t.driver?.name || 'Unassigned'}
                        </div>
                      </td>

                      <td>
                        <strong>{t.customer?.name || t.customer?.companyName || 'Walk-in'}</strong>
                        {t.customer?.phone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {t.customer.phone}
                          </div>
                        )}
                      </td>

                      <td>
                        <strong style={{ fontSize: '0.98rem' }}>{formatCurrency(t.totalFreight)}</strong>
                      </td>

                      <td>
                        <div style={{ color: 'var(--success-text)', fontWeight: 600 }}>
                          Rec: {formatCurrency(t.amountReceived)}
                        </div>
                        <div
                          style={{
                            color:
                              (t.pendingAmount || 0) > 0 ? 'var(--danger-text)' : 'var(--text-muted)',
                            fontSize: '0.8rem',
                          }}
                        >
                          Due: {formatCurrency(t.pendingAmount)}
                        </div>
                      </td>

                      <td>
                        {t.status === 'COMPLETED' ? (
                          <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--danger-text)' }}>
                              Exp: {formatCurrency(t.totalTripExpense)}
                            </div>
                            <div
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color:
                                  (t.tripProfit || 0) >= 0
                                    ? 'var(--success-text)'
                                    : 'var(--danger-text)',
                              }}
                            >
                              Profit: {formatCurrency(t.tripProfit)}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                            In Progress
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span
                            className={`badge ${
                              t.status === 'COMPLETED'
                                ? 'badge-success'
                                : t.status === 'CANCELLED'
                                ? 'badge-danger'
                                : 'badge-warning'
                            }`}
                          >
                            {t.status || 'ONGOING'}
                          </span>

                          {t.status === 'ONGOING' && (
                            <button
                              onClick={() => setCompleteTripId(t.id)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                            >
                              <IconCheckCircle size={13} />
                              <span>Complete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Trip Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create & Dispatch Commercial Trip"
        size="lg"
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
              form="create-trip-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Dispatching...' : 'Dispatch Trip'}
            </button>
          </>
        }
      >
        <form id="create-trip-form" onSubmit={handleAddTrip}>
          {/* Trip Type Selector */}
          <div className="form-group">
            <label className="form-label" htmlFor="tripType">
              Trip Category <span className="required">*</span>
            </label>
            <select
              id="tripType"
              name="tripType"
              className="form-select"
              value={formData.tripType}
              onChange={handleInputChange}
              required
            >
              <option value="GOODS">GOODS (Heavy Freight / Cargo Transport)</option>
              <option value="PASSENGER">PASSENGER (Bus / Shuttle Route)</option>
              <option value="TAXI">TAXI (Commercial Taxi / Cab Ride)</option>
              <option value="CONTRACT">CONTRACT (Long Term Corporate Dedicated)</option>
            </select>
          </div>

          {/* Common Locations */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="pickupLocation">
                Pickup Origin Location <span className="required">*</span>
              </label>
              <input
                id="pickupLocation"
                name="pickupLocation"
                type="text"
                className="form-control"
                placeholder="e.g. Hyderabad Depot, Uppal"
                value={formData.pickupLocation}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dropLocation">
                Drop Destination Location <span className="required">*</span>
              </label>
              <input
                id="dropLocation"
                name="dropLocation"
                type="text"
                className="form-control"
                placeholder="e.g. Vijayawada Logistics Hub"
                value={formData.dropLocation}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Dynamic Section: GOODS */}
          {formData.tripType === 'GOODS' && (
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                border: '1px solid var(--border-color)',
              }}
            >
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '12px' }}>
                Goods & Consignment Specifications
              </h4>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="loadType">
                    Load / Cargo Type
                  </label>
                  <input
                    id="loadType"
                    name="loadType"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Cement, Steel Rods, FMCG"
                    value={formData.loadType}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="unit">
                    Billing Unit
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    className="form-select"
                    value={formData.unit}
                    onChange={handleInputChange}
                  >
                    <option value="Tons">Tons (MT)</option>
                    <option value="Bags">Bags / Packets</option>
                    <option value="Litres">Litres</option>
                    <option value="Kg">Kilograms (Kg)</option>
                    <option value="Fixed">Fixed Trip Rate</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="quantity">
                    Cargo Quantity
                  </label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    step="any"
                    className="form-control"
                    placeholder="e.g. 24"
                    value={formData.quantity}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="rate">
                    Freight Rate / Unit (₹)
                  </label>
                  <input
                    id="rate"
                    name="rate"
                    type="number"
                    min="0"
                    step="any"
                    className="form-control"
                    placeholder="e.g. 1200"
                    value={formData.rate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Section: PASSENGER / TAXI */}
          {(formData.tripType === 'PASSENGER' || formData.tripType === 'TAXI') && (
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="passengerCount">
                  Passenger Occupancy Count
                </label>
                <input
                  id="passengerCount"
                  name="passengerCount"
                  type="number"
                  min="1"
                  className="form-control"
                  placeholder="e.g. 4"
                  value={formData.passengerCount}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          {/* Vehicle, Driver, Customer dropdowns */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="tripVehicleId">
                Assigned Vehicle <span className="required">*</span>
              </label>
              <select
                id="tripVehicleId"
                name="vehicleId"
                className="form-select"
                value={formData.vehicleId}
                onChange={handleInputChange}
                required
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleName} - {v.registrationNumber} ({v.vehicleType})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tripDriverId">
                Assigned Driver
              </label>
              <select
                id="tripDriverId"
                name="driverId"
                className="form-select"
                value={formData.driverId}
                onChange={handleInputChange}
              >
                <option value="">-- No Driver Assigned --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="tripCustomerId">
                Customer / Consignor
              </label>
              <select
                id="tripCustomerId"
                name="customerId"
                className="form-select"
                value={formData.customerId}
                onChange={handleInputChange}
              >
                <option value="">-- Walk-in / Direct Shipper --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tripDate">
                Trip Dispatch Date <span className="required">*</span>
              </label>
              <input
                id="tripDate"
                name="tripDate"
                type="date"
                className="form-control"
                value={formData.tripDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Financials: Freight, Received, Status */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="totalFreight">
                {formData.tripType === 'GOODS'
                  ? 'Total Freight (₹)'
                  : formData.tripType === 'CONTRACT'
                  ? 'Contract Amount (₹)'
                  : 'Total Fare (₹)'}{' '}
                <span className="required">*</span>
              </label>
              <input
                id="totalFreight"
                name="totalFreight"
                type="number"
                min="0"
                step="any"
                className="form-control"
                placeholder="e.g. 28000"
                value={formData.totalFreight}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="amountReceived">
                Advance / Received (₹)
              </label>
              <input
                id="amountReceived"
                name="amountReceived"
                type="number"
                min="0"
                step="any"
                className="form-control"
                placeholder="e.g. 10000"
                value={formData.amountReceived}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tripStatus">
                Initial Status
              </label>
              <select
                id="tripStatus"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="ONGOING">ONGOING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Complete Trip Confirmation */}
      <ConfirmDialog
        isOpen={!!completeTripId}
        onClose={() => setCompleteTripId(null)}
        onConfirm={handleCompleteTrip}
        title="Complete Trip Dispatch"
        message="Marking this trip as COMPLETED will calculate the total recorded trip expenses (fuel, tolls, driver allowance) and determine final net profit."
        confirmText="Mark as Completed"
        loading={completing}
      />
    </div>
  );
}

