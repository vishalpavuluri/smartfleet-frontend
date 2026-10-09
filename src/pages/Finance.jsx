import React, { useState, useEffect } from 'react';
import {
  financeAPI,
  financePaymentAPI,
  vehicleAPI,
  getErrorMessage,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard, { formatCurrency } from '../components/StatCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import {
  IconCreditCard,
  IconPlus,
  IconDollar,
  IconCheckCircle,
} from '../components/Icons';

export default function Finance() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'payments'
  const [finances, setFinances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddFinanceOpen, setIsAddFinanceOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Finance Form
  const [financeForm, setFinanceForm] = useState({
    financeProvider: '',
    loanAmount: '',
    emiAmount: '',
    dueDate: '5',
    startDate: new Date().toISOString().substring(0, 10),
    tenure: '36',
    remainingEmis: '36',
    remainingAmount: '',
    status: 'ACTIVE',
    vehicleId: '',
  });

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().substring(0, 10),
    dueDate: new Date().toISOString().substring(0, 10),
    status: 'SUCCESS',
    transactionReference: '',
    financeId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fRes, pRes, vRes] = await Promise.allSettled([
        financeAPI.getAll(),
        financePaymentAPI.getAll(),
        vehicleAPI.getAll(),
      ]);

      if (fRes.status === 'fulfilled') setFinances(fRes.value.data || []);
      if (pRes.status === 'fulfilled') setPayments(pRes.value.data || []);
      if (vRes.status === 'fulfilled') {
        const vList = vRes.value.data || [];
        setVehicles(vList);
        if (vList.length > 0 && !financeForm.vehicleId) {
          setFinanceForm((prev) => ({ ...prev, vehicleId: String(vList[0].id) }));
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch financial data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update remainingAmount default if loanAmount changes
  const handleFinanceChange = (e) => {
    const { name, value } = e.target;
    setFinanceForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'loanAmount' && !prev.remainingAmount) {
        updated.remainingAmount = value;
      }
      return updated;
    });
  };

  const handleAddFinance = async (e) => {
    e.preventDefault();
    if (!financeForm.vehicleId) {
      toast.error('Please select a vehicle');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        financeProvider: financeForm.financeProvider.trim(),
        loanAmount: Number(financeForm.loanAmount),
        emiAmount: Number(financeForm.emiAmount),
        dueDate: Number(financeForm.dueDate),
        startDate: financeForm.startDate,
        tenure: Number(financeForm.tenure),
        remainingEmis: Number(financeForm.remainingEmis),
        remainingAmount: Number(financeForm.remainingAmount || financeForm.loanAmount),
        status: financeForm.status,
        vehicle: { id: Number(financeForm.vehicleId) },
      };

      await financeAPI.create(payload);
      toast.success('Finance plan created successfully!');
      setIsAddFinanceOpen(false);
      setFinanceForm({
        financeProvider: '',
        loanAmount: '',
        emiAmount: '',
        dueDate: '5',
        startDate: new Date().toISOString().substring(0, 10),
        tenure: '36',
        remainingEmis: '36',
        remainingAmount: '',
        status: 'ACTIVE',
        vehicleId: vehicles[0]?.id ? String(vehicles[0].id) : '',
      });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create finance plan'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.financeId) {
      toast.error('Please select a finance plan');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        dueDate: paymentForm.dueDate,
        status: paymentForm.status,
        transactionReference: paymentForm.transactionReference.trim(),
        finance: { id: Number(paymentForm.financeId) },
      };

      await financePaymentAPI.create(payload);
      toast.success('EMI Payment logged successfully!');
      setIsAddPaymentOpen(false);
      setPaymentForm({
        amount: '',
        paymentDate: new Date().toISOString().substring(0, 10),
        dueDate: new Date().toISOString().substring(0, 10),
        status: 'SUCCESS',
        transactionReference: '',
        financeId: finances[0]?.id ? String(finances[0].id) : '',
      });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not record EMI payment'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading loans & EMI payment schedules..." />;
  }

  const totalOutstanding = finances.reduce((sum, f) => sum + (f.remainingAmount || 0), 0);
  const monthlyCommitment = finances.reduce((sum, f) => sum + (f.emiAmount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <PageHeader
        title="Vehicle Finance & EMI Management"
        subtitle="Track auto loans, monthly installments, due dates, and payment history"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                if (vehicles.length === 0) {
                  toast.warning('Please add a vehicle first before creating a loan');
                  return;
                }
                setIsAddFinanceOpen(true);
              }}
              className="btn btn-primary"
            >
              <IconPlus size={16} />
              <span>Add Loan / Finance</span>
            </button>
            <button
              onClick={() => {
                if (finances.length === 0) {
                  toast.warning('Please create a finance plan first before recording payments');
                  return;
                }
                setPaymentForm((prev) => ({
                  ...prev,
                  financeId: String(finances[0].id),
                  amount: String(finances[0].emiAmount || ''),
                }));
                setIsAddPaymentOpen(true);
              }}
              className="btn btn-outline"
            >
              <IconCheckCircle size={16} />
              <span>Record EMI Payment</span>
            </button>
          </div>
        }
      />

      {/* Stats Summary */}
      <div className="stats-grid">
        <StatCard
          title="Active Loan Plans"
          value={finances.length}
          subtitle="Registered finance contracts"
          icon={IconCreditCard}
          color="blue"
        />

        <StatCard
          title="Total Outstanding"
          value={totalOutstanding}
          subtitle="Remaining principal & interest"
          icon={IconDollar}
          color="red"
          isCurrency
        />

        <StatCard
          title="Monthly Commitment"
          value={monthlyCommitment}
          subtitle="Sum of active monthly EMIs"
          icon={IconCreditCard}
          color="amber"
          isCurrency
        />

        <StatCard
          title="Total EMI Payments"
          value={totalPaid}
          subtitle={`${payments.length} installments recorded`}
          icon={IconCheckCircle}
          color="green"
          isCurrency
        />
      </div>

      {/* Tab Navigation */}
      <div className="nav-tabs">
        <button
          onClick={() => setActiveTab('plans')}
          className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
        >
          Active Loan & EMI Plans ({finances.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
        >
          EMI Payment History ({payments.length})
        </button>
      </div>

      {/* Tab: PLANS */}
      {activeTab === 'plans' && (
        <div className="sf-card">
          <div className="sf-card-header">
            <h3 className="sf-card-title">Loan Contracts</h3>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {finances.length === 0 ? (
              <EmptyState
                title="No active finance plans"
                description="Keep track of your vehicle loans and upcoming due dates by adding your loan details."
                actionLabel="Add Loan Plan"
                onAction={() => setIsAddFinanceOpen(true)}
              />
            ) : (
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Lender / Provider</th>
                      <th>Loan Amount</th>
                      <th>Monthly EMI</th>
                      <th>Due Day</th>
                      <th>Remaining EMIs</th>
                      <th>Remaining Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finances.map((f) => (
                      <tr key={f.id}>
                        <td>
                          <strong>{f.vehicle?.vehicleName || 'Vehicle'}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {f.vehicle?.registrationNumber}
                          </div>
                        </td>
                        <td><strong>{f.financeProvider}</strong></td>
                        <td>{formatCurrency(f.loanAmount)}</td>
                        <td><strong>{formatCurrency(f.emiAmount)}</strong></td>
                        <td>{f.dueDate ? `Day ${f.dueDate} of month` : '—'}</td>
                        <td>{f.remainingEmis ?? f.tenure} / {f.tenure} mos</td>
                        <td>
                          <span style={{ color: 'var(--danger-text)', fontWeight: 700 }}>
                            {formatCurrency(f.remainingAmount)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${f.status === 'ACTIVE' ? 'badge-primary' : 'badge-neutral'}`}
                          >
                            {f.status || 'ACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="sf-card">
          <div className="sf-card-header">
            <h3 className="sf-card-title">Recorded EMI Installments</h3>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {payments.length === 0 ? (
              <EmptyState
                title="No EMI payments recorded"
                description="Log your paid monthly installments to keep an accurate ledger of remaining tenure."
                actionLabel="Record Payment"
                onAction={() => {
                  if (finances.length > 0) {
                    setPaymentForm((prev) => ({
                      ...prev,
                      financeId: String(finances[0].id),
                      amount: String(finances[0].emiAmount || ''),
                    }));
                  }
                  setIsAddPaymentOpen(true);
                }}
              />
            ) : (
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Payment Date</th>
                      <th>Provider / Vehicle</th>
                      <th>Amount Paid</th>
                      <th>Due Date</th>
                      <th>Txn Reference</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.paymentDate}</strong></td>
                        <td>
                          {p.finance?.financeProvider || 'Finance'}
                          {p.finance?.vehicle && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {p.finance.vehicle.vehicleName} ({p.finance.vehicle.registrationNumber})
                            </div>
                          )}
                        </td>
                        <td><strong>{formatCurrency(p.amount)}</strong></td>
                        <td>{p.dueDate || '—'}</td>
                        <td>
                          <code>{p.transactionReference || 'N/A'}</code>
                        </td>
                        <td>
                          <span className="badge badge-success">{p.status || 'PAID'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Finance Modal */}
      <Modal
        isOpen={isAddFinanceOpen}
        onClose={() => setIsAddFinanceOpen(false)}
        title="Create Vehicle Loan / Finance Plan"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddFinanceOpen(false)}
              className="btn btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-finance-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Finance Plan'}
            </button>
          </>
        }
      >
        <form id="add-finance-form" onSubmit={handleAddFinance}>
          <div className="form-group">
            <label className="form-label" htmlFor="vehicleId">
              Select Vehicle <span className="required">*</span>
            </label>
            <select
              id="vehicleId"
              name="vehicleId"
              className="form-select"
              value={financeForm.vehicleId}
              onChange={handleFinanceChange}
              required
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicleName} - {v.registrationNumber} ({v.brand} {v.model})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="financeProvider">
              Lender / Finance Provider <span className="required">*</span>
            </label>
            <input
              id="financeProvider"
              name="financeProvider"
              type="text"
              className="form-control"
              placeholder="e.g. HDFC Bank, SBI Auto Loan, Tata Capital"
              value={financeForm.financeProvider}
              onChange={handleFinanceChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="loanAmount">
                Total Loan Amount (₹) <span className="required">*</span>
              </label>
              <input
                id="loanAmount"
                name="loanAmount"
                type="number"
                min="1"
                step="any"
                className="form-control"
                placeholder="e.g. 850000"
                value={financeForm.loanAmount}
                onChange={handleFinanceChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="emiAmount">
                Monthly EMI (₹) <span className="required">*</span>
              </label>
              <input
                id="emiAmount"
                name="emiAmount"
                type="number"
                min="1"
                step="any"
                className="form-control"
                placeholder="e.g. 18500"
                value={financeForm.emiAmount}
                onChange={handleFinanceChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="dueDate">
                EMI Due Day of Month <span className="required">*</span>
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="number"
                min="1"
                max="31"
                className="form-control"
                placeholder="e.g. 5"
                value={financeForm.dueDate}
                onChange={handleFinanceChange}
                required
              />
              <span className="form-help">Day 1 to 31 when payment is auto-debited</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="startDate">
                Loan Start Date <span className="required">*</span>
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className="form-control"
                value={financeForm.startDate}
                onChange={handleFinanceChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="tenure">
                Total Tenure (Months) <span className="required">*</span>
              </label>
              <input
                id="tenure"
                name="tenure"
                type="number"
                min="1"
                className="form-control"
                value={financeForm.tenure}
                onChange={handleFinanceChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="remainingEmis">
                Remaining EMIs <span className="required">*</span>
              </label>
              <input
                id="remainingEmis"
                name="remainingEmis"
                type="number"
                min="0"
                className="form-control"
                value={financeForm.remainingEmis}
                onChange={handleFinanceChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="remainingAmount">
              Remaining Loan Principal (₹)
            </label>
            <input
              id="remainingAmount"
              name="remainingAmount"
              type="number"
              min="0"
              step="any"
              className="form-control"
              placeholder="Leave empty to use full loan amount"
              value={financeForm.remainingAmount}
              onChange={handleFinanceChange}
            />
          </div>
        </form>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        isOpen={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        title="Record EMI Installment Payment"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddPaymentOpen(false)}
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
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </>
        }
      >
        <form id="add-payment-form" onSubmit={handleAddPayment}>
          <div className="form-group">
            <label className="form-label" htmlFor="paymentFinanceId">
              Select Loan Plan <span className="required">*</span>
            </label>
            <select
              id="paymentFinanceId"
              name="financeId"
              className="form-select"
              value={paymentForm.financeId}
              onChange={(e) => {
                const fId = e.target.value;
                const match = finances.find((f) => String(f.id) === fId);
                setPaymentForm((prev) => ({
                  ...prev,
                  financeId: fId,
                  amount: match?.emiAmount ? String(match.emiAmount) : prev.amount,
                }));
              }}
              required
            >
              {finances.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.financeProvider} - EMI: {formatCurrency(f.emiAmount)} (
                  {f.vehicle?.vehicleName || 'Vehicle'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="payAmount">
                Amount Paid (₹) <span className="required">*</span>
              </label>
              <input
                id="payAmount"
                name="amount"
                type="number"
                min="1"
                step="any"
                className="form-control"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="paymentDate">
                Payment Date <span className="required">*</span>
              </label>
              <input
                id="paymentDate"
                name="paymentDate"
                type="date"
                className="form-control"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="dueDate">
                Due Date
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                className="form-control"
                value={paymentForm.dueDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="transactionReference">
                Transaction Ref / UTR / Cheque #
              </label>
              <input
                id="transactionReference"
                name="transactionReference"
                type="text"
                className="form-control"
                placeholder="e.g. UTR1982348273"
                value={paymentForm.transactionReference}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, transactionReference: e.target.value })
                }
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

