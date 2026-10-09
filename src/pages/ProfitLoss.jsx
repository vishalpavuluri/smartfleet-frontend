import React, { useState, useEffect } from 'react';
import { dashboardAPI, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard, { formatCurrency } from '../components/StatCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconDollar,
  IconReceipt,
  IconTool,
  IconShield,
  IconTag,
  IconCreditCard,
  IconPrinter,
  IconRefreshCw,
} from '../components/Icons';

export default function ProfitLoss() {
  const toast = useToast();

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFinancials = async (month) => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getMonthlyProfit(month);
      setReport(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, `Could not load financial data for ${month}`));
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials(selectedMonth);
  }, [selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  // Calculations
  const revenue = report?.totalRevenue || 0;
  const expenses = report?.totalExpenses || 0;
  const netProfit = report?.finalProfit ?? (revenue - expenses);
  const isProfit = netProfit >= 0;
  const marginPct = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0';

  // Expense breakdown items
  const expenseBreakdown = [
    { label: 'Trip Freight & Route Expenses', amount: report?.tripExpenses || 0, icon: IconReceipt, desc: 'Diesel, tolls, and en-route driver allowances' },
    { label: 'General Vehicle Expenses', amount: report?.vehicleExpenses || 0, icon: IconReceipt, desc: 'EV charging, parking, depot costs' },
    { label: 'Finance & EMI Payments', amount: report?.emiPayments || 0, icon: IconCreditCard, desc: 'Commercial vehicle loan instalments' },
    { label: 'Fleet Maintenance & Repairs', amount: report?.maintenanceExpenses || 0, icon: IconTool, desc: 'Garage service, periodic overhaul, parts' },
    { label: 'Insurance Premiums', amount: report?.insuranceExpenses || 0, icon: IconShield, desc: 'Comprehensive commercial vehicle insurance' },
    { label: 'FASTag Electronic Tolls', amount: report?.fastagExpenses || 0, icon: IconTag, desc: 'Highway toll transactions via FASTag' },
  ];

  return (
    <div>
      <PageHeader
        title="Profit & Loss Statement"
        subtitle="Monthly financial report reconciling freight earnings against operational fleet expenditures"
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handlePrint} className="btn btn-outline">
              <IconPrinter size={16} /> Print Report
            </button>
            <button onClick={() => fetchFinancials(selectedMonth)} className="btn btn-outline" title="Refresh">
              <IconRefreshCw size={16} />
            </button>
          </div>
        }
      />

      {/* Month Selector Bar */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-main)', marginRight: '10px' }}>
            Reporting Period:
          </span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Select calendar month to reconcile accounts
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="month"
            className="form-control"
            style={{ width: '180px', fontWeight: 600 }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button
            onClick={() => setSelectedMonth(currentMonthStr)}
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            Current Month
          </button>
        </div>
      </div>

      {loading ? (
        <Loader text={`Calculating financial audit for ${selectedMonth}...`} />
      ) : !report ? (
        <EmptyState
          title="No Financial Records"
          description={`Unable to retrieve financial metrics for ${selectedMonth}. Make sure backend is running.`}
          actionLabel="Retry"
          onAction={() => fetchFinancials(selectedMonth)}
        />
      ) : (
        <>
          {/* Key Financial KPIs */}
          <div className="stat-grid" style={{ marginBottom: '24px' }}>
            <StatCard
              label="Total Gross Revenue"
              value={formatCurrency(revenue)}
              subtext={`Freight & customer income for ${selectedMonth}`}
              icon={IconDollar}
              variant="success"
            />
            <StatCard
              label="Consolidated Expenses"
              value={formatCurrency(expenses)}
              subtext="Sum of all fleet operations"
              icon={IconTrendingDown}
              variant="danger"
            />
            <StatCard
              label={isProfit ? 'Net Operating Profit' : 'Net Operating Loss'}
              value={formatCurrency(Math.abs(netProfit))}
              subtext={isProfit ? `Operating Margin: +${marginPct}%` : `Deficit Margin: ${marginPct}%`}
              icon={isProfit ? IconTrendingUp : IconTrendingDown}
              variant={isProfit ? 'success' : 'danger'}
            />
          </div>

          {/* Revenue vs Expenses Ratio Bar */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Revenue vs Expense Performance</h3>
                <p className="card-subtitle">Visual distribution for financial month {report.month || selectedMonth}</p>
              </div>
              <div>
                <span
                  className={`badge ${isProfit ? 'badge-success' : 'badge-danger'}`}
                  style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                >
                  {isProfit ? 'PROFITABLE MONTH' : 'LOSS INCURRED'}
                </span>
              </div>
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                <span>
                  Gross Revenue: <strong style={{ color: 'var(--success-text)' }}>{formatCurrency(revenue)}</strong>
                </span>
                <span>
                  Fleet Expenditures: <strong style={{ color: 'var(--danger-text)' }}>{formatCurrency(expenses)}</strong>
                </span>
              </div>

              {/* Graphical Ratio */}
              {revenue + expenses > 0 ? (
                <div
                  style={{
                    height: '24px',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    display: 'flex',
                    backgroundColor: 'var(--border-subtle)',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      width: `${(revenue / (revenue + expenses)) * 100}%`,
                      backgroundColor: '#10b981',
                      transition: 'width 0.4s ease',
                    }}
                    title={`Revenue: ${formatCurrency(revenue)}`}
                  />
                  <div
                    style={{
                      width: `${(expenses / (revenue + expenses)) * 100}%`,
                      backgroundColor: '#ef4444',
                      transition: 'width 0.4s ease',
                    }}
                    title={`Expenses: ${formatCurrency(expenses)}`}
                  />
                </div>
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No transaction data registered for this month yet.
                </div>
              )}
            </div>
          </div>

          {/* Detailed Statement Ledger */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Itemized Statement of Accounts</h3>
                <p className="card-subtitle">Detailed ledger breakdown for audit and accounting</p>
              </div>
            </div>

            <div className="card-body">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Account Category</th>
                      <th>Operational Description</th>
                      <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                      <th style={{ textAlign: 'right' }}>% of Expenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Revenue Row */}
                    <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                      <td>
                        <strong style={{ color: 'var(--success-text)' }}>REVENUE (Total Freight)</strong>
                      </td>
                      <td>Trip collections, freight billings, customer advances</td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: 'var(--success-text)', fontSize: '1rem' }}>
                          +{formatCurrency(revenue)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>—</td>
                    </tr>

                    {/* Breakdown Rows */}
                    {expenseBreakdown.map((item, idx) => {
                      const share = expenses > 0 ? ((item.amount / expenses) * 100).toFixed(1) : '0.0';
                      const Icon = item.icon;
                      return (
                        <tr key={idx}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Icon size={16} style={{ color: 'var(--primary)' }} />
                              <span>{item.label}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.desc}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>
                              -{formatCurrency(item.amount)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{share}%</td>
                        </tr>
                      );
                    })}

                    {/* Total Expenses Row */}
                    <tr style={{ borderTop: '2px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}>
                      <td>
                        <strong style={{ color: 'var(--danger-text)' }}>TOTAL OPERATING EXPENSES</strong>
                      </td>
                      <td>Consolidated outflow across all vehicles</td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: 'var(--danger-text)', fontSize: '1rem' }}>
                          -{formatCurrency(expenses)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>100.0%</td>
                    </tr>

                    {/* Net Bottom Line */}
                    <tr
                      style={{
                        backgroundColor: isProfit ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        borderTop: '2px solid var(--border-color)',
                      }}
                    >
                      <td colSpan={2}>
                        <strong style={{ fontSize: '1.05rem', color: isProfit ? 'var(--success-text)' : 'var(--danger-text)' }}>
                          NET {isProfit ? 'PROFIT' : 'LOSS'} FOR THE PERIOD
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong
                          style={{
                            fontSize: '1.25rem',
                            color: isProfit ? 'var(--success-text)' : 'var(--danger-text)',
                          }}
                        >
                          {isProfit ? '+' : '-'}{formatCurrency(Math.abs(netProfit))}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: isProfit ? 'var(--success-text)' : 'var(--danger-text)' }}>
                          {marginPct}% Margin
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

