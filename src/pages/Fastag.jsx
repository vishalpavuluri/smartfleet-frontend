import React, { useState, useEffect } from 'react';
import { fastagAPI, vehicleAPI, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard, { formatCurrency } from '../components/StatCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import {
  IconTag,
  IconPlus,
  IconAlertTriangle,
  IconDollar,
  IconRefreshCw,
} from '../components/Icons';

export default function Fastag() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'transactions'
  const [fastags, setFastags] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddFastagOpen, setIsAddFastagOpen] = useState(false);
  const [isAddTxnOpen, setIsAddTxnOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form: FASTag
  const [fastagForm, setFastagForm] = useState({
    provider: '',
    fastagNumber: '',
    balance: '',
    minimumBalance: '200',
    lastRechargeDate: new Date().toISOString().substring(0, 10),
    lastRechargeAmount: '',
    status: 'ACTIVE',
    vehicleId: '',
  });

  // Form: Transaction
  const [txnForm, setTxnForm] = useState({
    transactionType: 'TOLL',
    amount: '',
    transactionDate: new Date().toISOString().substring(0, 10),
    location: '',
    referenceNumber: '',
    fastagId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fRes, tRes, vRes] = await Promise.allSettled([
        fastagAPI.getAll(),
        fastagAPI.getTransactions(),
        vehicleAPI.getAll(),
      ]);

      if (fRes.status === 'fulfilled') setFastags(fRes.value.data || []);
      if (tRes.status === 'fulfilled') setTransactions(tRes.value.data || []);
      if (vRes.status === 'fulfilled') {
        const vList = vRes.value.data || [];
        setVehicles(vList);
        if (vList.length > 0 && !fastagForm.vehicleId) {
          setFastagForm((prev) => ({ ...prev, vehicleId: String(vList[0].id) }));
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch FASTag details'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddFastag = async (e) => {
    e.preventDefault();
    if (!fastagForm.vehicleId) {
      toast.error('Please select a vehicle');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        provider: fastagForm.provider.trim(),
        fastagNumber: fastagForm.fastagNumber.trim(),
        balance: Number(fastagForm.balance),
        minimumBalance: Number(fastagForm.minimumBalance),
        lastRechargeDate: fastagForm.lastRechargeDate || null,
        lastRechargeAmount: fastagForm.lastRechargeAmount ? Number(fastagForm.lastRechargeAmount) : null,
        status: fastagForm.status,
        vehicle: { id: Number(fastagForm.vehicleId) },
      };

      await fastagAPI.create(payload);
      toast.success('FASTag account added successfully!');
      setIsAddFastagOpen(false);
      setFastagForm({
        provider: '',
        fastagNumber: '',
        balance: '',
        minimumBalance: '200',
        lastRechargeDate: new Date().toISOString().substring(0, 10),
        lastRechargeAmount: '',
        status: 'ACTIVE',
        vehicleId: vehicles[0]?.id ? String(vehicles[0].id) : '',
      });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save FASTag account'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTxn = async (e) => {
    e.preventDefault();
    if (!txnForm.fastagId) {
      toast.error('Please select a FASTag account');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        transactionType: txnForm.transactionType,
        amount: Number(txnForm.amount),
        transactionDate: txnForm.transactionDate,
        location: txnForm.location.trim(),
        referenceNumber: txnForm.referenceNumber.trim(),
        fastag: { id: Number(txnForm.fastagId) },
      };

      await fastagAPI.createTransaction(payload);
      toast.success('FASTag transaction recorded!');
      setIsAddTxnOpen(false);
      setTxnForm({
        transactionType: 'TOLL',
        amount: '',
        transactionDate: new Date().toISOString().substring(0, 10),
        location: '',
        referenceNumber: '',
        fastagId: fastags[0]?.id ? String(fastags[0].id) : '',
      });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not record FASTag transaction'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading FASTag accounts and toll transactions..." />;
  }

  const lowBalanceList = fastags.filter((f) => {
    const bal = f.balance || 0;
    const min = f.minimumBalance || 100;
    return bal <= min;
  });

  const totalWalletBalance = fastags.reduce((sum, f) => sum + (f.balance || 0), 0);
  const totalTollsPaid = transactions
    .filter((t) => t.transactionType === 'TOLL')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div>
      <PageHeader
        title="FASTag & Electronic Tolls"
        subtitle="Manage NETC FASTag wallets, low balance warnings, toll deductions, and recharges"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                if (vehicles.length === 0) {
                  toast.warning('Please add a vehicle first');
                  return;
                }
                setIsAddFastagOpen(true);
              }}
              className="btn btn-primary"
            >
              <IconPlus size={16} />
              <span>Register FASTag</span>
            </button>
            <button
              onClick={() => {
                if (fastags.length === 0) {
                  toast.warning('Please register a FASTag first');
                  return;
                }
                setTxnForm((prev) => ({ ...prev, fastagId: String(fastags[0].id) }));
                setIsAddTxnOpen(true);
              }}
              className="btn btn-outline"
            >
              <IconRefreshCw size={16} />
              <span>Record Toll / Recharge</span>
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Active Tags"
          value={fastags.length}
          subtitle="Vehicles with FASTag"
          icon={IconTag}
          color="blue"
        />

        <StatCard
          title="Total Wallet Balance"
          value={totalWalletBalance}
          subtitle="Across all vehicle tags"
          icon={IconDollar}
          color="teal"
          isCurrency
        />

        <StatCard
          title="Low Balance Alerts"
          value={lowBalanceList.length}
          subtitle="Below safety minimum threshold"
          icon={IconAlertTriangle}
          color={lowBalanceList.length > 0 ? 'red' : 'green'}
        />

        <StatCard
          title="Total Tolls Deducted"
          value={totalTollsPaid}
          subtitle={`${transactions.length} total transactions`}
          icon={IconDollar}
          color="amber"
          isCurrency
        />
      </div>

      {/* Tab Navigation */}
      <div className="nav-tabs">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
        >
          FASTag Accounts ({fastags.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
        >
          Toll & Recharge Logs ({transactions.length})
        </button>
      </div>

      {/* Tab: ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="sf-card">
          <div className="sf-card-header">
            <h3 className="sf-card-title">
              <IconTag size={18} />
              <span>Registered FASTag Accounts</span>
            </h3>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {fastags.length === 0 ? (
              <EmptyState
                title="No FASTag accounts registered"
                description="Link your vehicle FASTag tags to track toll plaza payments and maintain minimum threshold alerts."
                actionLabel="Register FASTag"
                onAction={() => setIsAddFastagOpen(true)}
                icon={IconTag}
              />
            ) : (
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Issuer / Provider</th>
                      <th>FASTag ID</th>
                      <th>Current Balance</th>
                      <th>Min Balance Alert</th>
                      <th>Last Recharge</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fastags.map((f) => {
                      const isLow = (f.balance || 0) <= (f.minimumBalance || 100);
                      return (
                        <tr key={f.id}>
                          <td>
                            <strong>{f.vehicle?.vehicleName || 'Vehicle'}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {f.vehicle?.registrationNumber}
                            </div>
                          </td>
                          <td><strong>{f.provider}</strong></td>
                          <td>
                            <code>{f.fastagNumber}</code>
                          </td>
                          <td>
                            <strong
                              style={{
                                color: isLow ? 'var(--danger-text)' : 'var(--success-text)',
                                fontSize: '1.05rem',
                              }}
                            >
                              {formatCurrency(f.balance)}
                            </strong>
                            {isLow && (
                              <span className="badge badge-danger" style={{ marginLeft: '6px' }}>
                                Low Balance!
                              </span>
                            )}
                          </td>
                          <td>{formatCurrency(f.minimumBalance)}</td>
                          <td>
                            {f.lastRechargeDate ? (
                              <div>
                                {f.lastRechargeDate}
                                {f.lastRechargeAmount && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    +{formatCurrency(f.lastRechargeAmount)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <span className="badge badge-success">{f.status || 'ACTIVE'}</span>
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
      )}

      {/* Tab: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="sf-card">
          <div className="sf-card-header">
            <h3 className="sf-card-title">
              <IconRefreshCw size={18} />
              <span>Toll & Recharge History</span>
            </h3>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {transactions.length === 0 ? (
              <EmptyState
                title="No transactions logged"
                description="Log toll charges at toll plazas or wallet recharges."
                actionLabel="Record Transaction"
                onAction={() => {
                  if (fastags.length > 0) {
                    setTxnForm((prev) => ({ ...prev, fastagId: String(fastags[0].id) }));
                  }
                  setIsAddTxnOpen(true);
                }}
              />
            ) : (
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Toll Plaza / Location</th>
                      <th>Vehicle Tag</th>
                      <th>Txn Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td><strong>{t.transactionDate}</strong></td>
                        <td>
                          <span
                            className={`badge ${
                              t.transactionType === 'RECHARGE' ? 'badge-success' : 'badge-warning'
                            }`}
                          >
                            {t.transactionType || 'TOLL'}
                          </span>
                        </td>
                        <td>
                          <strong
                            style={{
                              color:
                                t.transactionType === 'RECHARGE'
                                  ? 'var(--success-text)'
                                  : 'var(--danger-text)',
                            }}
                          >
                            {t.transactionType === 'RECHARGE' ? '+' : '-'}
                            {formatCurrency(t.amount)}
                          </strong>
                        </td>
                        <td>{t.location || 'Highway Toll Plaza'}</td>
                        <td>
                          {t.fastag?.provider} ({t.fastag?.fastagNumber})
                        </td>
                        <td>
                          <code>{t.referenceNumber || '—'}</code>
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

      {/* Add FASTag Modal */}
      <Modal
        isOpen={isAddFastagOpen}
        onClose={() => setIsAddFastagOpen(false)}
        title="Register Vehicle FASTag"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddFastagOpen(false)}
              className="btn btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-fastag-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Registering...' : 'Register FASTag'}
            </button>
          </>
        }
      >
        <form id="add-fastag-form" onSubmit={handleAddFastag}>
          <div className="form-group">
            <label className="form-label" htmlFor="ftVehicleId">
              Select Vehicle <span className="required">*</span>
            </label>
            <select
              id="ftVehicleId"
              name="vehicleId"
              className="form-select"
              value={fastagForm.vehicleId}
              onChange={(e) => setFastagForm({ ...fastagForm, vehicleId: e.target.value })}
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
              <label className="form-label" htmlFor="ftProvider">
                FASTag Issuer Bank / Provider <span className="required">*</span>
              </label>
              <input
                id="ftProvider"
                name="provider"
                type="text"
                className="form-control"
                placeholder="e.g. ICICI Bank, Paytm, SBI, IDFC"
                value={fastagForm.provider}
                onChange={(e) => setFastagForm({ ...fastagForm, provider: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fastagNumber">
                FASTag Barcode / Tag ID <span className="required">*</span>
              </label>
              <input
                id="fastagNumber"
                name="fastagNumber"
                type="text"
                className="form-control"
                placeholder="e.g. 60741700192837"
                value={fastagForm.fastagNumber}
                onChange={(e) => setFastagForm({ ...fastagForm, fastagNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="balance">
                Current Wallet Balance (₹) <span className="required">*</span>
              </label>
              <input
                id="balance"
                name="balance"
                type="number"
                step="any"
                className="form-control"
                placeholder="e.g. 650"
                value={fastagForm.balance}
                onChange={(e) => setFastagForm({ ...fastagForm, balance: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="minimumBalance">
                Min. Balance Warning Threshold (₹) <span className="required">*</span>
              </label>
              <input
                id="minimumBalance"
                name="minimumBalance"
                type="number"
                step="any"
                className="form-control"
                placeholder="e.g. 200"
                value={fastagForm.minimumBalance}
                onChange={(e) =>
                  setFastagForm({ ...fastagForm, minimumBalance: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="lastRechargeDate">
                Last Recharge Date
              </label>
              <input
                id="lastRechargeDate"
                name="lastRechargeDate"
                type="date"
                className="form-control"
                value={fastagForm.lastRechargeDate}
                onChange={(e) =>
                  setFastagForm({ ...fastagForm, lastRechargeDate: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastRechargeAmount">
                Last Recharge Amount (₹)
              </label>
              <input
                id="lastRechargeAmount"
                name="lastRechargeAmount"
                type="number"
                step="any"
                className="form-control"
                placeholder="e.g. 1000"
                value={fastagForm.lastRechargeAmount}
                onChange={(e) =>
                  setFastagForm({ ...fastagForm, lastRechargeAmount: e.target.value })
                }
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isAddTxnOpen}
        onClose={() => setIsAddTxnOpen(false)}
        title="Record FASTag Toll / Recharge"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddTxnOpen(false)}
              className="btn btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-txn-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Recording...' : 'Save Transaction'}
            </button>
          </>
        }
      >
        <form id="add-txn-form" onSubmit={handleAddTxn}>
          <div className="form-group">
            <label className="form-label" htmlFor="txnFastagId">
              Select FASTag Account <span className="required">*</span>
            </label>
            <select
              id="txnFastagId"
              name="fastagId"
              className="form-select"
              value={txnForm.fastagId}
              onChange={(e) => setTxnForm({ ...txnForm, fastagId: e.target.value })}
              required
            >
              {fastags.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.provider} - Tag: {f.fastagNumber} ({f.vehicle?.vehicleName || 'Vehicle'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="transactionType">
                Transaction Type <span className="required">*</span>
              </label>
              <select
                id="transactionType"
                name="transactionType"
                className="form-select"
                value={txnForm.transactionType}
                onChange={(e) => setTxnForm({ ...txnForm, transactionType: e.target.value })}
                required
              >
                <option value="TOLL">TOLL DEDUCTION</option>
                <option value="RECHARGE">WALLET RECHARGE</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="txnAmount">
                Amount (₹) <span className="required">*</span>
              </label>
              <input
                id="txnAmount"
                name="amount"
                type="number"
                min="1"
                step="any"
                className="form-control"
                placeholder="e.g. 135"
                value={txnForm.amount}
                onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="transactionDate">
                Transaction Date <span className="required">*</span>
              </label>
              <input
                id="transactionDate"
                name="transactionDate"
                type="date"
                className="form-control"
                value={txnForm.transactionDate}
                onChange={(e) => setTxnForm({ ...txnForm, transactionDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="location">
                Toll Plaza / Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                className="form-control"
                placeholder="e.g. Patancheru Toll Plaza, NH 65"
                value={txnForm.location}
                onChange={(e) => setTxnForm({ ...txnForm, location: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="refNo">
              Reference Number / NPCI UTR
            </label>
            <input
              id="refNo"
              name="referenceNumber"
              type="text"
              className="form-control"
              placeholder="e.g. NETC-29384729"
              value={txnForm.referenceNumber}
              onChange={(e) => setTxnForm({ ...txnForm, referenceNumber: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

