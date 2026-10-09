import React, { useState, useEffect } from 'react';
import {
  invoiceAPI,
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
  IconInvoice,
  IconPlus,
  IconSearch,
  IconPrinter,
  IconDollar,
  IconCheckCircle,
  IconEye,
} from '../components/Icons';

export default function Invoices() {
  const toast = useToast();

  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // View / Print Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    customerId: '',
    tripId: '',
    invoiceDate: new Date().toISOString().substring(0, 10),
    totalAmount: '',
    amountReceived: '0',
    status: 'UNPAID',
    remarks: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, custRes, tripRes] = await Promise.allSettled([
        invoiceAPI.getAll(),
        customerAPI.getAll(),
        tripAPI.getAll(),
      ]);

      if (invRes.status === 'fulfilled') setInvoices(invRes.value.data || []);
      if (custRes.status === 'fulfilled') setCustomers(custRes.value.data || []);
      if (tripRes.status === 'fulfilled') setTrips(tripRes.value.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch invoices'));
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

      // Auto update status and pending amount
      if (name === 'totalAmount' || name === 'amountReceived') {
        const total = Number(name === 'totalAmount' ? value : prev.totalAmount) || 0;
        const received = Number(name === 'amountReceived' ? value : prev.amountReceived) || 0;
        if (received >= total && total > 0) {
          updated.status = 'PAID';
        } else if (received > 0 && received < total) {
          updated.status = 'PARTIALLY_PAID';
        } else {
          updated.status = 'UNPAID';
        }
      }

      // Auto populate total amount if trip selected
      if (name === 'tripId' && value) {
        const chosenTrip = trips.find((t) => String(t.id) === String(value));
        if (chosenTrip) {
          if (chosenTrip.totalFreight && !updated.totalAmount) {
            updated.totalAmount = String(chosenTrip.totalFreight);
          }
          if (chosenTrip.customer?.id && !updated.customerId) {
            updated.customerId = String(chosenTrip.customer.id);
          }
        }
      }

      return updated;
    });
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();

    const total = Number(formData.totalAmount) || 0;
    const received = Number(formData.amountReceived) || 0;
    const pending = Math.max(0, total - received);

    if (total <= 0) {
      toast.error('Total invoice amount must be greater than zero');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        invoiceNumber: formData.invoiceNumber.trim(),
        invoiceDate: formData.invoiceDate,
        totalAmount: total,
        amountReceived: received,
        pendingAmount: pending,
        status: formData.status,
        remarks: formData.remarks.trim(),
        customer: formData.customerId ? { id: Number(formData.customerId) } : null,
        trip: formData.tripId ? { id: Number(formData.tripId) } : null,
      };

      await invoiceAPI.create(payload);
      toast.success('Invoice generated successfully!');
      setIsModalOpen(false);
      setFormData({
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        customerId: '',
        tripId: '',
        invoiceDate: new Date().toISOString().substring(0, 10),
        totalAmount: '',
        amountReceived: '0',
        status: 'UNPAID',
        remarks: '',
      });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create invoice'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Metrics
  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.amountReceived || 0), 0);
  const totalPending = invoices.reduce((sum, inv) => sum + (inv.pendingAmount || 0), 0);

  // Filters
  const filteredInvoices = invoices.filter((inv) => {
    const searchMatch =
      !searchTerm ||
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.remarks?.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = filterStatus === 'ALL' || inv.status === filterStatus;

    return searchMatch && statusMatch;
  });

  if (loading) {
    return <Loader text="Loading transport invoices..." />;
  }

  return (
    <div>
      <PageHeader
        title="Freight & Business Invoices"
        subtitle="Generate, track, and print transport bills and customer invoices"
        actions={
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <IconPlus size={16} /> Generate Invoice
          </button>
        }
      />

      {/* Metrics */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard
          label="Total Invoiced"
          value={formatCurrency(totalBilled)}
          subtext="Total gross billing"
          icon={IconInvoice}
          variant="primary"
        />
        <StatCard
          label="Total Paid"
          value={formatCurrency(totalCollected)}
          subtext="Settled revenue"
          icon={IconCheckCircle}
          variant="success"
        />
        <StatCard
          label="Outstanding Balance"
          value={formatCurrency(totalPending)}
          subtext="Pending payment"
          icon={IconDollar}
          variant={totalPending > 0 ? 'warning' : 'primary'}
        />
      </div>

      {/* Invoice Ledger Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="card-title">Invoices List</h2>
            <p className="card-subtitle">Complete billing history for clients and corporate accounts</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '240px' }}>
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
                placeholder="Search invoice #, customer..."
                className="form-control"
                style={{ paddingLeft: '32px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: '160px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
        </div>

        <div className="card-body">
          {filteredInvoices.length === 0 ? (
            <EmptyState
              title={invoices.length === 0 ? 'No invoices generated yet' : 'No matching invoices'}
              description={
                invoices.length === 0
                  ? 'Generate your first transport invoice for a trip or customer account to get started.'
                  : 'Try adjusting your search criteria.'
              }
              actionLabel={invoices.length === 0 ? 'Generate Invoice' : undefined}
              onAction={invoices.length === 0 ? () => setIsModalOpen(true) : undefined}
            />
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Customer / Company</th>
                    <th>Trip Details</th>
                    <th>Total Amount</th>
                    <th>Received</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <strong>{inv.invoiceNumber}</strong>
                      </td>
                      <td>{inv.invoiceDate || '—'}</td>
                      <td>
                        {inv.customer ? (
                          <div>
                            <strong>{inv.customer.name}</strong>
                            {inv.customer.companyName && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {inv.customer.companyName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Cash Customer</span>
                        )}
                      </td>
                      <td>
                        {inv.trip ? (
                          <div style={{ fontSize: '0.8rem' }}>
                            Trip #{inv.trip.id}: {inv.trip.pickupLocation} &rarr; {inv.trip.dropLocation}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <strong>{formatCurrency(inv.totalAmount)}</strong>
                      </td>
                      <td style={{ color: 'var(--success-text)' }}>
                        {formatCurrency(inv.amountReceived)}
                      </td>
                      <td style={{ color: inv.pendingAmount > 0 ? 'var(--danger-text)' : 'var(--text-muted)' }}>
                        {formatCurrency(inv.pendingAmount)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            inv.status === 'PAID'
                              ? 'badge-success'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {inv.status || 'UNPAID'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          title="View / Print Invoice"
                        >
                          <IconPrinter size={14} /> View / Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Transport Invoice"
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
              form="create-invoice-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Generating...' : 'Create Invoice'}
            </button>
          </>
        }
      >
        <form id="create-invoice-form" onSubmit={handleCreateInvoice}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="invNumber">
                Invoice Number <span className="required">*</span>
              </label>
              <input
                id="invNumber"
                name="invoiceNumber"
                type="text"
                className="form-control"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="invDate">
                Invoice Date <span className="required">*</span>
              </label>
              <input
                id="invDate"
                name="invoiceDate"
                type="date"
                className="form-control"
                value={formData.invoiceDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="invCustomer">
                Billed To (Customer)
              </label>
              <select
                id="invCustomer"
                name="customerId"
                className="form-select"
                value={formData.customerId}
                onChange={handleInputChange}
              >
                <option value="">-- Select Customer or Company --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="invTrip">
                Linked Trip
              </label>
              <select
                id="invTrip"
                name="tripId"
                className="form-select"
                value={formData.tripId}
                onChange={handleInputChange}
              >
                <option value="">-- Direct Billing / Non-Trip --</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    Trip #{t.id} : {t.pickupLocation} to {t.dropLocation} ({formatCurrency(t.totalFreight)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="invTotal">
                Total Invoice Amount (₹) <span className="required">*</span>
              </label>
              <input
                id="invTotal"
                name="totalAmount"
                type="number"
                min="1"
                step="any"
                className="form-control"
                placeholder="e.g. 25000"
                value={formData.totalAmount}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="invRecv">
                Amount Received (₹)
              </label>
              <input
                id="invRecv"
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Pending Balance (Auto-Calculated)
              </label>
              <input
                type="text"
                className="form-control"
                disabled
                value={formatCurrency(
                  Math.max(0, (Number(formData.totalAmount) || 0) - (Number(formData.amountReceived) || 0))
                )}
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="invStatus">
                Invoice Status <span className="required">*</span>
              </label>
              <select
                id="invStatus"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="UNPAID">UNPAID</option>
                <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="invRemarks">
              Terms / Remarks
            </label>
            <input
              id="invRemarks"
              name="remarks"
              type="text"
              className="form-control"
              placeholder="e.g. Net 15 days payment terms, GST included"
              value={formData.remarks}
              onChange={handleInputChange}
            />
          </div>
        </form>
      </Modal>

      {/* Print / View Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          size="lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="btn btn-outline"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-primary"
              >
                <IconPrinter size={16} /> Print / Save PDF
              </button>
            </>
          }
        >
          <div id="printable-invoice" className="printable-invoice" style={{ padding: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '2px solid var(--border-color)',
                paddingBottom: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 700 }}>
                  SMARTFLEET LOGISTICS
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Commercial Transport & Freight Management
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  GSTIN: 36ABCDE1234F1Z5 | Support: fleet-ops@smartfleet.com
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                  TAX INVOICE
                </h3>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '4px' }}>
                  {selectedInvoice.invoiceNumber}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Date: {selectedInvoice.invoiceDate || '—'}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span
                    className={`badge ${
                      selectedInvoice.status === 'PAID'
                        ? 'badge-success'
                        : selectedInvoice.status === 'PARTIALLY_PAID'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    STATUS: {selectedInvoice.status}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '24px',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                  Billed To:
                </strong>
                <div style={{ fontWeight: 700, marginTop: '4px' }}>
                  {selectedInvoice.customer?.name || 'Walk-in Client'}
                </div>
                {selectedInvoice.customer?.companyName && (
                  <div style={{ fontSize: '0.85rem' }}>{selectedInvoice.customer.companyName}</div>
                )}
                {selectedInvoice.customer?.gstNumber && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    GST: {selectedInvoice.customer.gstNumber}
                  </div>
                )}
                {selectedInvoice.customer?.phone && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Phone: {selectedInvoice.customer.phone}
                  </div>
                )}
              </div>

              {selectedInvoice.trip && (
                <div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                    Trip Manifest:
                  </strong>
                  <div style={{ fontWeight: 600, marginTop: '4px' }}>
                    Trip #{selectedInvoice.trip.id} ({selectedInvoice.trip.tripType || 'FREIGHT'})
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Route: {selectedInvoice.trip.pickupLocation} &rarr; {selectedInvoice.trip.dropLocation}
                  </div>
                  {selectedInvoice.trip.vehicle && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Vehicle: {selectedInvoice.trip.vehicle.vehicleName} ({selectedInvoice.trip.vehicle.registrationNumber})
                    </div>
                  )}
                </div>
              )}
            </div>

            <table className="table" style={{ marginBottom: '24px' }}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Transport & Freight Charges</strong>
                    {selectedInvoice.trip && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Delivery from {selectedInvoice.trip.pickupLocation} to {selectedInvoice.trip.dropLocation}
                      </div>
                    )}
                    {selectedInvoice.remarks && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Note: {selectedInvoice.remarks}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <div style={{ width: '280px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span>Total Bill Amount:</span>
                  <strong>{formatCurrency(selectedInvoice.totalAmount)}</strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    color: 'var(--success-text)',
                  }}
                >
                  <span>Amount Paid:</span>
                  <strong>{formatCurrency(selectedInvoice.amountReceived)}</strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderTop: '2px solid var(--border-color)',
                    fontSize: '1.05rem',
                    color: selectedInvoice.pendingAmount > 0 ? 'var(--danger-text)' : 'var(--text-main)',
                  }}
                >
                  <span>Balance Due:</span>
                  <strong>{formatCurrency(selectedInvoice.pendingAmount)}</strong>
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '12px',
                textAlign: 'center',
              }}
            >
              This is a computer generated invoice issued by SmartFleet Management Platform.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
