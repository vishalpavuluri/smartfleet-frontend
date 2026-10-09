import React, { useState, useEffect } from 'react';
import { customerAPI, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard, { formatCurrency } from '../components/StatCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import {
  IconUsers,
  IconPlus,
  IconSearch,
  IconDollar,
  IconCheckCircle,
} from '../components/Icons';

export default function Customers() {
  const toast = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    companyName: '',
    gstNumber: '',
    address: '',
    pendingAmount: '0',
    status: 'ACTIVE',
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerAPI.getAll();
      setCustomers(res.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch customers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        companyName: formData.companyName.trim(),
        gstNumber: formData.gstNumber.trim().toUpperCase(),
        address: formData.address.trim(),
        pendingAmount: formData.pendingAmount ? Number(formData.pendingAmount) : 0,
        status: formData.status,
      };

      await customerAPI.create(payload);
      toast.success('Customer registered successfully!');
      setIsModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        companyName: '',
        gstNumber: '',
        address: '',
        pendingAmount: '0',
        status: 'ACTIVE',
      });
      fetchCustomers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save customer'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading transport business clients..." />;
  }

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.pendingAmount || 0), 0);
  const activeClients = customers.filter((c) => c.status === 'ACTIVE');

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.companyName?.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.gstNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <PageHeader
        title="Business Customers"
        subtitle="Manage freight shippers, corporate accounts, GST details, and outstanding balances"
        actions={
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <IconPlus size={16} />
            <span>Add Customer</span>
          </button>
        }
      />

      {/* Stats Summary */}
      <div className="stats-grid">
        <StatCard
          title="Total Clients"
          value={customers.length}
          subtitle="Corporate & retail shippers"
          icon={IconUsers}
          color="blue"
        />

        <StatCard
          title="Active Accounts"
          value={activeClients.length}
          subtitle="Ready for booking"
          icon={IconCheckCircle}
          color="green"
        />

        <StatCard
          title="Total Pending Balance"
          value={totalOutstanding}
          subtitle="Receivable across accounts"
          icon={IconDollar}
          color={totalOutstanding > 0 ? 'red' : 'green'}
          isCurrency
        />
      </div>

      {/* Search Bar */}
      <div className="search-bar-wrap">
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by client name, company, or GST..."
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
      </div>

      {/* Customer List Table */}
      <div className="sf-card">
        <div className="sf-card-header">
          <h3 className="sf-card-title">
            <IconUsers size={18} />
            <span>Customer Accounts</span>
          </h3>
        </div>
        <div className="sf-card-body" style={{ padding: 0 }}>
          {filteredCustomers.length === 0 ? (
            <EmptyState
              title={searchTerm ? 'No clients match criteria' : 'No customers created yet'}
              description={
                searchTerm
                  ? 'Try adjusting your search criteria.'
                  : 'Add corporate customers or individual freight consignors to generate invoices and dispatch trips.'
              }
              actionLabel="Add Customer"
              onAction={() => setIsModalOpen(true)}
              icon={IconUsers}
            />
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Company Name</th>
                    <th>Contact Info</th>
                    <th>GST Number</th>
                    <th>Pending Due</th>
                    <th>Status</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>
                        <strong>{c.companyName || 'Individual'}</strong>
                      </td>
                      <td>
                        <div>
                          <a href={`tel:${c.phone}`} style={{ color: 'var(--primary)' }}>
                            {c.phone}
                          </a>
                        </div>
                        {c.email && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {c.email}
                          </div>
                        )}
                      </td>
                      <td>
                        {c.gstNumber ? <code>{c.gstNumber}</code> : '—'}
                      </td>
                      <td>
                        <strong
                          style={{
                            color:
                              (c.pendingAmount || 0) > 0 ? 'var(--danger-text)' : 'var(--text-main)',
                          }}
                        >
                          {formatCurrency(c.pendingAmount)}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            c.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'
                          }`}
                        >
                          {c.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {c.address || '—'}
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

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Customer / Consignor"
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
              form="add-customer-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Add Customer'}
            </button>
          </>
        }
      >
        <form id="add-customer-form" onSubmit={handleAddCustomer}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="custName">
                Contact Person Name <span className="required">*</span>
              </label>
              <input
                id="custName"
                name="name"
                type="text"
                className="form-control"
                placeholder="e.g. Suresh Reddy"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="companyName">
                Company / Organization
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                className="form-control"
                placeholder="e.g. Deccan Logistics Pvt Ltd"
                value={formData.companyName}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="custPhone">
                Mobile Number <span className="required">*</span>
              </label>
              <input
                id="custPhone"
                name="phone"
                type="tel"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="custEmail">
                Email Address
              </label>
              <input
                id="custEmail"
                name="email"
                type="email"
                className="form-control"
                placeholder="e.g. accounts@deccan.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="gstNumber">
                GSTIN Number
              </label>
              <input
                id="gstNumber"
                name="gstNumber"
                type="text"
                className="form-control"
                placeholder="e.g. 36AAACG1234F1Z5"
                value={formData.gstNumber}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pendingAmount">
                Initial Pending Balance (₹)
              </label>
              <input
                id="pendingAmount"
                name="pendingAmount"
                type="number"
                min="0"
                step="any"
                className="form-control"
                value={formData.pendingAmount}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="custAddress">
              Billing & Delivery Address
            </label>
            <textarea
              id="custAddress"
              name="address"
              rows="2"
              className="form-control"
              placeholder="e.g. Industrial Area Phase 2, Medchal"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

