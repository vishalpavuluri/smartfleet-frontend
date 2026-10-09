import React, { useState, useEffect } from 'react';
import {
  businessPaymentAPI,
  customerAPI,
  tripAPI,
  getErrorMessage,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard, { formatCurrency } from '../components/StatCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import {
  IconDollar,
  IconPlus,
  IconSearch,
  IconUsers,
  IconMapPin,
  IconCheckCircle,
} from '../components/Icons';

export default function BusinessPayments() {
  const toast = useToast();

  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    tripId: '',
    amount: '',
    paymentDate: new Date().toISOString().substring(0, 10),
    paymentMode: 'UPI',
    status: 'RECEIVED',
    transactionReference: '',
    remarks: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, custRes, tripRes] = await Promise.allSettled([
        businessPaymentAPI.getAll(),
        customerAPI.getAll(),
        tripAPI.getAll(),
      ]);

      if (payRes.status === 'fulfilled') setPayments(payRes.value.data || []);
      if (custRes.status === 'fulfilled') setCustomers(custRes.value.data || []);
      if (tripRes.status === 'fulfilled') setTrips(tripRes.value.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch business payments'));
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

  const handleAddPayment = async (e) => {
    e.preventDefault();

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        amount: Number(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMode: formData.paymentMode,
        status: formData.status,
        transactionReference: formData.transactionReference.trim(),
        remarks: formData.remarks.trim(),
        customer: formData.customerId ? { id: Number(formData.customerId) } : null,
        trip: formData.tripId ? { id: Number(formData.tripId) } : null,
      };

      await businessPaymentAPI.create(payload);
      toast.success('Payment recorded successfully!');
      setIsModalOpen(false);
      setFormData({
        customerId: '',
        tripId: '',
        amount: '',
        paymentDate: new Date().toISOString().substring(0, 10),
        paymentMode: 'UPI',
        status: 'RECEIVED',
        transactionReference: '',
        remarks: '',
      });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to record payment'));
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const totalReceived = payments
    .filter((p) => p.status === 'RECEIVED' || p.status === 'CLEARED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingPayments = payments
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Filtered List
  const filteredPayments = payments.filter((p) => {
    const searchMatch =
      !searchTerm ||
      p.transactionReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.trip && `${p.trip.pickupLocation} ${p.trip.dropLocation}`.toLowerCase().includes(searchTerm.toLowerCase()));

    const modeMatch = filterMode === 'ALL' || p.paymentMode === filterMode;
    const statusMatch = filterStatus === 'ALL' || p.status === filterStatus;

    return searchMatch && modeMatch && statusMatch;
  });

  if (loading) {
    return <Loader text="Loading payments ledger..." />;
  }

  return (
    <div>
      <PageHeader
        title="Business Payments"
        subtitle="Track incoming freight payments, customer receipts, and invoice settlements"
        actions={
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <IconPlus size={16} /> Record Payment
          </button>
        }
      />

      {/* Metrics */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard
          label="Total Collected"
          value={formatCurrency(totalReceived)}
          subtext="Received and cleared"
          icon={IconDollar}
          variant="success"
        />
        <StatCard
          label="Pending Collections"
          value={formatCurrency(pendingPayments)}
          subtext="Awaiting clearance"
          icon={IconDollar}
          variant={pendingPayments > 0 ? 'warning' : 'primary'}
        />
        <StatCard
          label="Total Transactions"
          value={payments.length}
          subtext="Entries recorded"
          icon={IconCheckCircle}
          variant="primary"
        />
      </div>

      {/* Filters and List */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="card-title">Payment Receipts</h2>
            <p className="card-subtitle">Complete ledger of freight and customer income</p>
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
                placeholder="Search reference, customer..."
                className="form-control"
                style={{ paddingLeft: '32px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: '140px' }}
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
            >
              <option value="ALL">All Modes</option>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="BANK TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CARD">Card</option>
            </select>

            <select
              className="form-select"
              style={{ width: '140px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="RECEIVED">Received</option>
              <option value="CLEARED">Cleared</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        <div className="card-body">
          {filteredPayments.length === 0 ? (
            <EmptyState
              title={payments.length === 0 ? 'No payments recorded yet' : 'No matching payments found'}
              description={
                payments.length === 0
                  ? 'Record your first customer payment or trip freight collection to keep your ledger up to date.'
                  : 'Try adjusting your search query or filters.'
              }
              actionLabel={payments.length === 0 ? 'Record Payment' : undefined}
              onAction={payments.length === 0 ? () => setIsModalOpen(true) : undefined}
            />
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Trip / Route</th>
                    <th>Payment Mode</th>
                    <th>Reference #</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.paymentDate || '—'}</strong></td>
                      <td>
                        {p.customer ? (
                          <div>
                            <strong>{p.customer.name}</strong>
                            {p.customer.companyName && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {p.customer.companyName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Direct / Counter</span>
                        )}
                      </td>
                      <td>
                        {p.trip ? (
                          <div>
                            <strong>Trip #{p.trip.id}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {p.trip.pickupLocation} &rarr; {p.trip.dropLocation}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>General Receipt</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-info">{p.paymentMode || 'OTHER'}</span>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem' }}>{p.transactionReference || 'N/A'}</code>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--success-text)', fontSize: '0.95rem' }}>
                          +{formatCurrency(p.amount)}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.status === 'RECEIVED' || p.status === 'CLEARED'
                              ? 'badge-success'
                              : 'badge-warning'
                          }`}
                        >
                          {p.status || 'RECEIVED'}
                        </span>
                      </td>
                      <td>{p.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Incoming Payment"
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
              form="add-payment-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Recording...' : 'Save Payment'}
            </button>
          </>
        }
      >
        <form id="add-payment-form" onSubmit={handleAddPayment}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="payCustomer">
                Select Customer (Optional)
              </label>
              <select
                id="payCustomer"
                name="customerId"
                className="form-select"
                value={formData.customerId}
                onChange={handleInputChange}
              >
                <option value="">-- Direct / Walk-in Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="payTrip">
                Select Trip (Optional)
              </label>
              <select
                id="payTrip"
                name="tripId"
                className="form-select"
                value={formData.tripId}
                onChange={handleInputChange}
              >
                <option value="">-- General Account Settlement --</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    Trip #{t.id} : {t.pickupLocation} &rarr; {t.dropLocation} ({formatCurrency(t.totalFreight)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="payAmount">
                Amount Received (₹) <span className="required">*</span>
              </label>
              <input
                id="payAmount"
                name="amount"
                type="number"
                min="1"
                step="any"
                className="form-control"
                placeholder="e.g. 15000"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="payDate">
                Payment Date <span className="required">*</span>
              </label>
              <input
                id="payDate"
                name="paymentDate"
                type="date"
                className="form-control"
                value={formData.paymentDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="payMode">
                Payment Mode <span className="required">*</span>
              </label>
              <select
                id="payMode"
                name="paymentMode"
                className="form-select"
                value={formData.paymentMode}
                onChange={handleInputChange}
                required
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="CASH">Cash</option>
                <option value="BANK TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="payStatus">
                Payment Status <span className="required">*</span>
              </label>
              <select
                id="payStatus"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="RECEIVED">RECEIVED</option>
                <option value="CLEARED">CLEARED</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="payRef">
              Transaction / UTR / Cheque Reference #
            </label>
            <input
              id="payRef"
              name="transactionReference"
              type="text"
              className="form-control"
              placeholder="e.g. UTR928374928174 or CHQ-00291"
              value={formData.transactionReference}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="payRemarks">
              Remarks / Notes
            </label>
            <input
              id="payRemarks"
              name="remarks"
              type="text"
              className="form-control"
              placeholder="e.g. Advance payment for freight delivery"
              value={formData.remarks}
              onChange={handleInputChange}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

