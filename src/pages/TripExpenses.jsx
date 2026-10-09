import React, { useState, useEffect } from 'react';
import { tripExpenseAPI, tripAPI, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard, { formatCurrency } from '../components/StatCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { IconReceipt, IconPlus, IconDollar, IconMapPin } from '../components/Icons';

export default function TripExpenses() {
  const toast = useToast();

  const [tripExpenses, setTripExpenses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    expenseType: 'FUEL',
    amount: '',
    expenseDate: new Date().toISOString().substring(0, 10),
    description: '',
    tripId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teRes, tRes] = await Promise.allSettled([
        tripExpenseAPI.getAll(),
        tripAPI.getAll(),
      ]);

      if (teRes.status === 'fulfilled') setTripExpenses(teRes.value.data || []);
      if (tRes.status === 'fulfilled') {
        const tList = tRes.value.data || [];
        setTrips(tList);
        if (tList.length > 0 && !formData.tripId) {
          setFormData((prev) => ({ ...prev, tripId: String(tList[0].id) }));
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch trip expenses'));
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

  const handleAddTripExpense = async (e) => {
    e.preventDefault();
    if (!formData.tripId) {
      toast.error('Please assign this expense to a trip');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        expenseType: formData.expenseType,
        amount: Number(formData.amount),
        expenseDate: formData.expenseDate,
        description: formData.description.trim(),
        trip: { id: Number(formData.tripId) },
      };

      await tripExpenseAPI.create(payload);
      toast.success('Trip expense recorded!');
      setIsModalOpen(false);
      setFormData({
        expenseType: 'FUEL',
        amount: '',
        expenseDate: new Date().toISOString().substring(0, 10),
        description: '',
        tripId: trips[0]?.id ? String(trips[0].id) : '',
      });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save trip expense'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading on-road voyage and trip expenses..." />;
  }

  const totalTripExpenses = tripExpenses.reduce((sum, te) => sum + (te.amount || 0), 0);
  const fuelExpenses = tripExpenses
    .filter((te) => te.expenseType === 'FUEL')
    .reduce((sum, te) => sum + (te.amount || 0), 0);
  const tollExpenses = tripExpenses
    .filter((te) => te.expenseType === 'TOLL')
    .reduce((sum, te) => sum + (te.amount || 0), 0);
  const allowanceExpenses = tripExpenses
    .filter((te) => te.expenseType === 'DRIVER ALLOWANCE')
    .reduce((sum, te) => sum + (te.amount || 0), 0);

  return (
    <div>
      <PageHeader
        title="Trip Voyage Expenses"
        subtitle="Manage en-route costs incurred during freight runs: diesel, toll tickets, driver batta, and loading labor"
        actions={
          <button
            onClick={() => {
              if (trips.length === 0) {
                toast.warning('Please create at least one trip first');
                return;
              }
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <IconPlus size={16} />
            <span>Add Trip Expense</span>
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Trip Expenses"
          value={totalTripExpenses}
          subtitle={`${tripExpenses.length} entries across trips`}
          icon={IconDollar}
          color="red"
          isCurrency
        />

        <StatCard
          title="En-route Fuel / Diesel"
          value={fuelExpenses}
          subtitle="Fuel bunk payments"
          icon={IconReceipt}
          color="amber"
          isCurrency
        />

        <StatCard
          title="Highway Tolls"
          value={tollExpenses}
          subtitle="Toll plaza cash & slips"
          icon={IconReceipt}
          color="teal"
          isCurrency
        />

        <StatCard
          title="Driver Allowance (Batta)"
          value={allowanceExpenses}
          subtitle="Food & driver daily batta"
          icon={IconDollar}
          color="blue"
          isCurrency
        />
      </div>

      {/* Trip Expenses Table */}
      <div className="sf-card">
        <div className="sf-card-header">
          <h3 className="sf-card-title">
            <IconReceipt size={18} />
            <span>Trip Expenses Ledger</span>
          </h3>
        </div>
        <div className="sf-card-body" style={{ padding: 0 }}>
          {tripExpenses.length === 0 ? (
            <EmptyState
              title="No trip expenses logged"
              description="Record on-road trip costs to accurately evaluate net voyage profit margins."
              actionLabel="Add Trip Expense"
              onAction={() => setIsModalOpen(true)}
              icon={IconReceipt}
            />
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Trip Manifest / Route</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {tripExpenses.map((te) => (
                    <tr key={te.id}>
                      <td><strong>{te.expenseDate}</strong></td>
                      <td>
                        <strong>
                          Trip #{te.trip?.id}: {te.trip?.pickupLocation} &rarr; {te.trip?.dropLocation}
                        </strong>
                        {te.trip?.vehicle && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {te.trip.vehicle.vehicleName} ({te.trip.vehicle.registrationNumber})
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-info">{te.expenseType}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--danger-text)' }}>
                          {formatCurrency(te.amount)}
                        </strong>
                      </td>
                      <td>{te.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Trip Expense"
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
              form="add-trip-expense-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Expense'}
            </button>
          </>
        }
      >
        <form id="add-trip-expense-form" onSubmit={handleAddTripExpense}>
          <div className="form-group">
            <label className="form-label" htmlFor="teTripId">
              Select Trip <span className="required">*</span>
            </label>
            <select
              id="teTripId"
              name="tripId"
              className="form-select"
              value={formData.tripId}
              onChange={handleInputChange}
              required
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  Trip #{t.id} - {t.pickupLocation} to {t.dropLocation} ({t.vehicle?.vehicleName || 'Vehicle'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="teType">
                Expense Category <span className="required">*</span>
              </label>
              <select
                id="teType"
                name="expenseType"
                className="form-select"
                value={formData.expenseType}
                onChange={handleInputChange}
                required
              >
                <option value="FUEL">FUEL (Diesel / CNG)</option>
                <option value="TOLL">TOLL TICKETS</option>
                <option value="DRIVER ALLOWANCE">DRIVER ALLOWANCE (Batta)</option>
                <option value="LOADING">LOADING LABOR</option>
                <option value="UNLOADING">UNLOADING LABOR</option>
                <option value="PARKING">PARKING</option>
                <option value="FOOD">FOOD / MEALS</option>
                <option value="REPAIR">EMERGENCY PUNCTURE / REPAIR</option>
                <option value="OTHER">OTHER EXPENSE</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="teAmount">
                Amount (₹) <span className="required">*</span>
              </label>
              <input
                id="teAmount"
                name="amount"
                type="number"
                min="1"
                step="any"
                className="form-control"
                placeholder="e.g. 3500"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="teDate">
              Expense Date <span className="required">*</span>
            </label>
            <input
              id="teDate"
              name="expenseDate"
              type="date"
              className="form-control"
              value={formData.expenseDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="teDesc">
              Notes / Toll Plaza / Receipt Reference
            </label>
            <input
              id="teDesc"
              name="description"
              type="text"
              className="form-control"
              placeholder="e.g. Reliance Diesel Pump, NH 44"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

