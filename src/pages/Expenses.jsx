import React, { useState, useEffect } from 'react';
import { expenseAPI, vehicleAPI, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard, { formatCurrency } from '../components/StatCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { IconReceipt, IconPlus, IconDollar, IconCar } from '../components/Icons';

export default function Expenses() {
  const toast = useToast();

  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    expenseType: 'FUEL',
    amount: '',
    expenseDate: new Date().toISOString().substring(0, 10),
    description: '',
    vehicleId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eRes, vRes] = await Promise.allSettled([
        expenseAPI.getAll(),
        vehicleAPI.getAll(),
      ]);

      if (eRes.status === 'fulfilled') setExpenses(eRes.value.data || []);
      if (vRes.status === 'fulfilled') {
        const vList = vRes.value.data || [];
        setVehicles(vList);
        if (vList.length > 0 && !formData.vehicleId) {
          setFormData((prev) => ({ ...prev, vehicleId: String(vList[0].id) }));
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch expenses'));
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

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formData.vehicleId) {
      toast.error('Please select a vehicle');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        expenseType: formData.expenseType,
        amount: Number(formData.amount),
        expenseDate: formData.expenseDate,
        description: formData.description.trim(),
        vehicle: { id: Number(formData.vehicleId) },
      };

      await expenseAPI.create(payload);
      toast.success('Expense recorded successfully!');
      setIsModalOpen(false);
      setFormData({
        expenseType: 'FUEL',
        amount: '',
        expenseDate: new Date().toISOString().substring(0, 10),
        description: '',
        vehicleId: vehicles[0]?.id ? String(vehicles[0].id) : '',
      });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save expense'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading vehicle running expenses..." />;
  }

  const filteredExpenses = expenses.filter((e) => {
    if (filterType === 'ALL') return true;
    return e.expenseType === filterType;
  });

  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const fuelSpent = expenses
    .filter((e) => e.expenseType === 'FUEL' || e.expenseType === 'EV CHARGING')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div>
      <PageHeader
        title="Vehicle Expenses"
        subtitle="Track fuel top-ups, EV charging bills, parking receipts, washing, and minor repairs"
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
            <span>Record Expense</span>
          </button>
        }
      />

      {/* Stats Summary */}
      <div className="stats-grid">
        <StatCard
          title="Total Expenses Logged"
          value={expenses.length}
          subtitle="Expense vouchers recorded"
          icon={IconReceipt}
          color="blue"
        />

        <StatCard
          title="Total Expenditure"
          value={totalSpent}
          subtitle="All categories combined"
          icon={IconDollar}
          color="red"
          isCurrency
        />

        <StatCard
          title="Fuel & Energy Spend"
          value={fuelSpent}
          subtitle="Petrol, Diesel, CNG & EV"
          icon={IconCar}
          color="amber"
          isCurrency
        />

        <StatCard
          title="Avg Spend / Voucher"
          value={expenses.length > 0 ? totalSpent / expenses.length : 0}
          subtitle="Per incident expense"
          icon={IconDollar}
          color="teal"
          isCurrency
        />
      </div>

      {/* Filter Bar */}
      <div className="search-bar-wrap">
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Filter by Type:
        </label>
        <select
          className="form-select"
          style={{ width: '200px' }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ALL">All Categories</option>
          <option value="FUEL">FUEL</option>
          <option value="EV CHARGING">EV CHARGING</option>
          <option value="PARKING">PARKING</option>
          <option value="REPAIR">REPAIR</option>
          <option value="WASHING">WASHING</option>
          <option value="OTHER">OTHER</option>
        </select>
      </div>

      {/* Expenses Table */}
      <div className="sf-card">
        <div className="sf-card-header">
          <h3 className="sf-card-title">
            <IconReceipt size={18} />
            <span>Expense Ledger</span>
          </h3>
        </div>
        <div className="sf-card-body" style={{ padding: 0 }}>
          {filteredExpenses.length === 0 ? (
            <EmptyState
              title="No expenses found"
              description="Track daily running costs by recording fuel top-ups, parking, and miscellaneous bills."
              actionLabel="Add Expense"
              onAction={() => setIsModalOpen(true)}
              icon={IconReceipt}
            />
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((e) => (
                    <tr key={e.id}>
                      <td><strong>{e.expenseDate}</strong></td>
                      <td>
                        <strong>{e.vehicle?.vehicleName || 'Vehicle'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {e.vehicle?.registrationNumber}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">{e.expenseType}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--danger-text)' }}>
                          {formatCurrency(e.amount)}
                        </strong>
                      </td>
                      <td>{e.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Vehicle Expense"
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
              form="add-expense-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Expense'}
            </button>
          </>
        }
      >
        <form id="add-expense-form" onSubmit={handleAddExpense}>
          <div className="form-group">
            <label className="form-label" htmlFor="expVehicleId">
              Select Vehicle <span className="required">*</span>
            </label>
            <select
              id="expVehicleId"
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
              <label className="form-label" htmlFor="expenseType">
                Expense Category <span className="required">*</span>
              </label>
              <select
                id="expenseType"
                name="expenseType"
                className="form-select"
                value={formData.expenseType}
                onChange={handleInputChange}
                required
              >
                <option value="FUEL">FUEL (Petrol / Diesel / CNG)</option>
                <option value="EV CHARGING">EV CHARGING</option>
                <option value="PARKING">PARKING</option>
                <option value="REPAIR">REPAIR / PUNCTURE</option>
                <option value="WASHING">WASHING & CLEANING</option>
                <option value="OTHER">OTHER MISCELLANEOUS</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="amount">
                Amount (₹) <span className="required">*</span>
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="1"
                step="any"
                className="form-control"
                placeholder="e.g. 2400"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="expenseDate">
              Expense Date <span className="required">*</span>
            </label>
            <input
              id="expenseDate"
              name="expenseDate"
              type="date"
              className="form-control"
              value={formData.expenseDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Description / Location / Notes
            </label>
            <input
              id="description"
              name="description"
              type="text"
              className="form-control"
              placeholder="e.g. HP Petrol Pump - 25 Litres Diesel"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

