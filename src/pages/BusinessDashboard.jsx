import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  vehicleAPI,
  driverAPI,
  customerAPI,
  tripAPI,
  invoiceAPI,
  notificationAPI,
  dashboardAPI,
} from '../services/api';
import PageHeader from '../components/PageHeader';
import StatCard, { formatCurrency } from '../components/StatCard';
import Loader from '../components/Loader';
import {
  IconTruck,
  IconUsers,
  IconMapPin,
  IconDollar,
  IconTrendingUp,
  IconTrendingDown,
  IconInvoice,
  IconBell,
  IconPlus,
} from '../components/Icons';

export default function BusinessDashboard() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Month format YYYY-MM
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [monthlyFinancials, setMonthlyFinancials] = useState(null);
  const [finLoading, setFinLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCoreData = async () => {
      try {
        setLoading(true);
        const [vRes, dRes, cRes, tRes, iRes, nRes] = await Promise.allSettled([
          vehicleAPI.getAll(),
          driverAPI.getAll(),
          customerAPI.getAll(),
          tripAPI.getAll(),
          invoiceAPI.getAll(),
          notificationAPI.getUnread(),
        ]);

        if (vRes.status === 'fulfilled') setVehicles(vRes.value.data || []);
        if (dRes.status === 'fulfilled') setDrivers(dRes.value.data || []);
        if (cRes.status === 'fulfilled') setCustomers(cRes.value.data || []);
        if (tRes.status === 'fulfilled') setTrips(tRes.value.data || []);
        if (iRes.status === 'fulfilled') setInvoices(iRes.value.data || []);
        if (nRes.status === 'fulfilled') setUnreadCount(nRes.value.data?.length || 0);
      } catch (err) {
        console.error('Error loading business dashboard operations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoreData();
  }, []);

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        setFinLoading(true);
        const res = await dashboardAPI.getMonthlyProfit(selectedMonth);
        setMonthlyFinancials(res.data);
      } catch (err) {
        console.error('Error fetching monthly financials:', err);
        setMonthlyFinancials(null);
      } finally {
        setFinLoading(false);
      }
    };

    if (selectedMonth) {
      fetchFinancials();
    }
  }, [selectedMonth]);

  if (loading) {
    return <Loader text="Loading transport business operations..." />;
  }

  const ongoingTrips = trips.filter((t) => t.status === 'ONGOING');
  const pendingInvoices = invoices.filter((inv) => inv.status !== 'PAID');
  const totalPendingPayments = pendingInvoices.reduce(
    (sum, inv) => sum + (inv.pendingAmount || 0),
    0
  );

  const fin = monthlyFinancials || {
    totalRevenue: 0,
    tripExpenses: 0,
    vehicleExpenses: 0,
    emiPayments: 0,
    maintenanceExpenses: 0,
    insuranceExpenses: 0,
    fastagExpenses: 0,
    totalExpenses: 0,
    finalProfit: 0,
  };

  const isProfit = (fin.finalProfit || 0) >= 0;

  return (
    <div>
      <PageHeader
        title="Business Operations Dashboard"
        subtitle="Live freight metrics, fleet dispatch status, and monthly financial performance"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate('/business/trips')} className="btn btn-primary">
              <IconPlus size={16} />
              <span>New Trip</span>
            </button>
            <button onClick={() => navigate('/business/invoices')} className="btn btn-outline">
              <IconInvoice size={16} />
              <span>Invoices</span>
            </button>
          </div>
        }
      />

      {/* Operational Overview Grid */}
      <div className="stats-grid">
        <StatCard
          title="Fleet Size"
          value={vehicles.length}
          subtitle="Commercial vehicles"
          icon={IconTruck}
          color="blue"
        />

        <StatCard
          title="Active Drivers"
          value={drivers.length}
          subtitle="Assigned & available"
          icon={IconUsers}
          color="teal"
        />

        <StatCard
          title="Customers"
          value={customers.length}
          subtitle="Active clients"
          icon={IconUsers}
          color="cyan"
        />

        <StatCard
          title="Active Trips"
          value={ongoingTrips.length}
          subtitle={`Total trips: ${trips.length}`}
          icon={IconMapPin}
          color="amber"
        />

        <StatCard
          title="Pending Receivables"
          value={totalPendingPayments}
          subtitle={`${pendingInvoices.length} unpaid invoices`}
          icon={IconDollar}
          color="red"
          isCurrency
        />

        <StatCard
          title="Unread Alerts"
          value={unreadCount}
          subtitle="Operational notifications"
          icon={IconBell}
          color={unreadCount > 0 ? 'amber' : 'green'}
        />
      </div>

      {/* Monthly Financial Performance Card */}
      <div className="sf-card" style={{ marginBottom: '24px' }}>
        <div className="sf-card-header">
          <div className="sf-card-title">
            <IconTrendingUp size={20} />
            <span>Monthly Financial Statement</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Month:
            </label>
            <input
              type="month"
              className="form-control"
              style={{ width: '160px', padding: '6px 10px' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>

        <div className="sf-card-body">
          {finLoading ? (
            <Loader text="Calculating monthly financials..." size={28} />
          ) : (
            <div>
              {/* Highlight Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: isProfit ? 'var(--success-bg)' : 'var(--danger-bg)',
                  border: `1px solid ${isProfit ? '#bbf7d0' : '#fecaca'}`,
                  marginBottom: '24px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Total Gross Revenue
                  </div>
                  <div
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      marginTop: '4px',
                    }}
                  >
                    {formatCurrency(fin.totalRevenue)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Total Operating Expenses
                  </div>
                  <div
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      color: 'var(--danger-text)',
                      marginTop: '4px',
                    }}
                  >
                    {formatCurrency(fin.totalExpenses)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Net Monthly Result
                  </div>
                  <div
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      color: isProfit ? 'var(--success-text)' : 'var(--danger-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px',
                    }}
                  >
                    {isProfit ? <IconTrendingUp size={26} /> : <IconTrendingDown size={26} />}
                    {formatCurrency(fin.finalProfit)}
                    <span
                      className={`badge ${isProfit ? 'badge-success' : 'badge-danger'}`}
                      style={{ fontSize: '0.8rem', verticalAlign: 'middle' }}
                    >
                      {isProfit ? 'PROFIT' : 'LOSS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expense Breakdown Grid */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>
                Itemized Expense Breakdown ({selectedMonth})
              </h4>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '14px',
                }}
              >
                <div className="sf-card" style={{ padding: '14px', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Trip Expenses</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{formatCurrency(fin.tripExpenses)}</div>
                </div>

                <div className="sf-card" style={{ padding: '14px', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Vehicle Expenses</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{formatCurrency(fin.vehicleExpenses)}</div>
                </div>

                <div className="sf-card" style={{ padding: '14px', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>EMI Payments</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{formatCurrency(fin.emiPayments)}</div>
                </div>

                <div className="sf-card" style={{ padding: '14px', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Maintenance</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{formatCurrency(fin.maintenanceExpenses)}</div>
                </div>

                <div className="sf-card" style={{ padding: '14px', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Insurance</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{formatCurrency(fin.insuranceExpenses)}</div>
                </div>

                <div className="sf-card" style={{ padding: '14px', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>FASTag Tolls</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{formatCurrency(fin.fastagExpenses)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ongoing Trips & Recent Invoices */}
      <div className="grid-2">
        <div className="sf-card">
          <div className="sf-card-header">
            <div className="sf-card-title">
              <IconMapPin size={18} />
              <span>Ongoing Trips ({ongoingTrips.length})</span>
            </div>
            <button onClick={() => navigate('/business/trips')} className="btn btn-outline btn-sm">
              Manage Trips
            </button>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {ongoingTrips.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No trips currently in transit.
              </div>
            ) : (
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Trip / Route</th>
                      <th>Vehicle</th>
                      <th>Driver</th>
                      <th>Freight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ongoingTrips.slice(0, 5).map((t) => (
                      <tr key={t.id}>
                        <td>
                          <strong>{t.pickupLocation} &rarr; {t.dropLocation}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Type: {t.tripType} &bull; {t.tripDate}
                          </div>
                        </td>
                        <td>{t.vehicle?.vehicleName || '—'}</td>
                        <td>{t.driver?.name || '—'}</td>
                        <td><strong>{formatCurrency(t.totalFreight)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="sf-card">
          <div className="sf-card-header">
            <div className="sf-card-title">
              <IconInvoice size={18} />
              <span>Recent Invoices ({invoices.length})</span>
            </div>
            <button onClick={() => navigate('/business/invoices')} className="btn btn-outline btn-sm">
              View Invoices
            </button>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {invoices.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No invoices created yet.
              </div>
            ) : (
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 5).map((inv) => (
                      <tr key={inv.id}>
                        <td><strong>{inv.invoiceNumber}</strong></td>
                        <td>{inv.customer?.name || inv.customer?.companyName || '—'}</td>
                        <td>{formatCurrency(inv.totalAmount)}</td>
                        <td>
                          <span
                            className={`badge ${
                              inv.status === 'PAID'
                                ? 'badge-success'
                                : inv.status === 'PARTIAL'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {inv.status || 'UNPAID'}
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
      </div>
    </div>
  );
}

