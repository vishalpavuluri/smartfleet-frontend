import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  vehicleAPI,
  financeAPI,
  maintenanceAPI,
  insuranceAPI,
  documentAPI,
  fastagAPI,
  expenseAPI,
  tripAPI,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../components/StatCard';
import {
  IconCar,
  IconCreditCard,
  IconTool,
  IconShield,
  IconFileText,
  IconTag,
  IconReceipt,
  IconMapPin,
  IconTruck,
} from '../components/Icons';

export default function VehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mode } = useAuth();

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState(null);
  const [finances, setFinances] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [fastags, setFastags] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vRes, fRes, mRes, iRes, dRes, ftRes, eRes, tRes] = await Promise.allSettled([
          vehicleAPI.getAll(),
          financeAPI.getAll(),
          maintenanceAPI.getAll(),
          insuranceAPI.getAll(),
          documentAPI.getAll(),
          fastagAPI.getAll(),
          expenseAPI.getAll(),
          mode === 'business' ? tripAPI.getAll() : Promise.resolve({ data: [] }),
        ]);

        if (vRes.status === 'fulfilled') {
          const allVehicles = vRes.value.data || [];
          const found = allVehicles.find((v) => String(v.id) === String(id));
          setVehicle(found || null);
        }

        const vId = Number(id);
        if (fRes.status === 'fulfilled') {
          setFinances((fRes.value.data || []).filter((f) => f.vehicle?.id === vId));
        }
        if (mRes.status === 'fulfilled') {
          setMaintenances((mRes.value.data || []).filter((m) => m.vehicle?.id === vId));
        }
        if (iRes.status === 'fulfilled') {
          setInsurances((iRes.value.data || []).filter((i) => i.vehicle?.id === vId));
        }
        if (dRes.status === 'fulfilled') {
          setDocuments((dRes.value.data || []).filter((d) => d.vehicle?.id === vId));
        }
        if (ftRes.status === 'fulfilled') {
          setFastags((ftRes.value.data || []).filter((ft) => ft.vehicle?.id === vId));
        }
        if (eRes.status === 'fulfilled') {
          setExpenses((eRes.value.data || []).filter((e) => e.vehicle?.id === vId));
        }
        if (tRes.status === 'fulfilled') {
          setTrips((tRes.value.data || []).filter((t) => t.vehicle?.id === vId));
        }
      } catch (err) {
        console.error('Error loading vehicle details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, mode]);

  if (loading) {
    return <Loader text="Loading vehicle profile & records..." />;
  }

  if (!vehicle) {
    return (
      <div className="sf-card">
        <EmptyState
          title="Vehicle Not Found"
          description="Could not locate the vehicle record requested."
          actionLabel="Back to Vehicles"
          onAction={() => navigate(mode === 'business' ? '/business/fleet' : '/personal/vehicles')}
        />
      </div>
    );
  }

  const isBusiness = mode === 'business';
  const totalExpensesSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalMaintenanceSpent = maintenances.reduce((sum, m) => sum + (m.serviceCost || 0), 0);

  return (
    <div>
      <PageHeader
        title={vehicle.vehicleName}
        subtitle={`${vehicle.brand} ${vehicle.model} • ${vehicle.registrationNumber} • ${vehicle.vehicleType}`}
        actions={
          <button
            onClick={() => navigate(isBusiness ? '/business/fleet' : '/personal/vehicles')}
            className="btn btn-outline"
          >
            &larr; Back to Fleet
          </button>
        }
      />

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
        >
          Finance ({finances.length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
        >
          Maintenance ({maintenances.length})
        </button>
        <button
          onClick={() => setActiveTab('insurance')}
          className={`tab-btn ${activeTab === 'insurance' ? 'active' : ''}`}
        >
          Insurance ({insurances.length})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
        >
          Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('fastag')}
          className={`tab-btn ${activeTab === 'fastag' ? 'active' : ''}`}
        >
          FASTag ({fastags.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
        >
          Expenses ({expenses.length})
        </button>
        {isBusiness && (
          <button
            onClick={() => setActiveTab('trips')}
            className={`tab-btn ${activeTab === 'trips' ? 'active' : ''}`}
          >
            Trips ({trips.length})
          </button>
        )}
      </div>

      {/* Tab: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid-2">
          <div className="sf-card">
            <div className="sf-card-header">
              <h3 className="sf-card-title">
                <IconCar size={18} />
                <span>Vehicle Specifications</span>
              </h3>
            </div>
            <div className="sf-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nickname</span>
                  <div style={{ fontWeight: 600 }}>{vehicle.vehicleName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registration</span>
                  <div style={{ fontWeight: 600 }}>
                    <span className="badge badge-primary">{vehicle.registrationNumber}</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Make / Brand</span>
                  <div style={{ fontWeight: 600 }}>{vehicle.brand}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Model</span>
                  <div style={{ fontWeight: 600 }}>{vehicle.model}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Body Type</span>
                  <div style={{ fontWeight: 600 }}>{vehicle.vehicleType}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fuel Type</span>
                  <div style={{ fontWeight: 600 }}>{vehicle.fuelType}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Odometer</span>
                  <div style={{ fontWeight: 600 }}>{Number(vehicle.currentKm || 0).toLocaleString()} KM</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</span>
                  <div style={{ fontWeight: 600 }}>
                    <span className="badge badge-success">IN SERVICE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sf-card">
            <div className="sf-card-header">
              <h3 className="sf-card-title">
                <IconReceipt size={18} />
                <span>Cost & Records Summary</span>
              </h3>
            </div>
            <div className="sf-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="sf-card" style={{ padding: '12px', background: 'var(--bg-subtle)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total General Expenses</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(totalExpensesSpent)}</div>
                </div>

                <div className="sf-card" style={{ padding: '12px', background: 'var(--bg-subtle)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Maintenance Incurred</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(totalMaintenanceSpent)}</div>
                </div>

                <div className="sf-card" style={{ padding: '12px', background: 'var(--bg-subtle)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Active Loans</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{finances.length} Active</div>
                </div>

                <div className="sf-card" style={{ padding: '12px', background: 'var(--bg-subtle)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Registered FASTag</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    {fastags.length > 0 ? formatCurrency(fastags[0].balance) : 'None'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: FINANCE */}
      {activeTab === 'finance' && (
        <div className="sf-card">
          <div className="sf-card-header">
            <h3 className="sf-card-title">Loan & Finance Plans</h3>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {finances.length === 0 ? (
              <EmptyState title="No finance records" description="No active loan or EMI attached to this vehicle." />
            ) : (
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Loan Amount</th>
                      <th>EMI Amount</th>
                      <th>Remaining EMIs</th>
                      <th>Remaining Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finances.map((f) => (
                      <tr key={f.id}>
                        <td><strong>{f.financeProvider}</strong></td>
                        <td>{formatCurrency(f.loanAmount)}</td>
                        <td>{formatCurrency(f.emiAmount)}</td>
                        <td>{f.remainingEmis} / {f.tenure}</td>
                        <td><strong>{formatCurrency(f.remainingAmount)}</strong></td>
                        <td><span className="badge badge-primary">{f.status || 'ACTIVE'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="sf-card">
          <div className="sf-card-header">
            <h3 className="sf-card-title">Service & Maintenance History</h3>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {maintenances.length === 0 ? (
              <EmptyState title="No maintenance logs" description="No maintenance services recorded for this vehicle yet." />
            ) : (
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Service Date</th>
                      <th>Type</th>
                      <th>KM</th>
                      <th>Next Due Date</th>
                      <th>Cost</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenances.map((m) => (
                      <tr key={m.id}>
                        <td><strong>{m.serviceDate}</strong></td>
                        <td><span className="badge badge-info">{m.serviceType || 'Service'}</span></td>
                        <td>{m.serviceKm} km</td>
                        <td>{m.nextServiceDate || '—'} ({m.nextServiceKm ? `${m.nextServiceKm} km` : '—'})</td>
                        <td><strong>{formatCurrency(m.serviceCost)}</strong></td>
                        <td>{m.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: INSURANCE */}
      {activeTab === 'insurance' && (
        <div className="sf-card">
          <div className="sf-card-header">
            <h3 className="sf-card-title">Insurance Policies</h3>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {insurances.length === 0 ? (
              <EmptyState title="No insurance policies" description="No policies recorded for this vehicle." />
            ) : (
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Policy #</th>
                      <th>Start Date</th>
                      <th>Expiry Date</th>
                      <th>Premium</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insurances.map((i) => (
                      <tr key={i.id}>
                        <td><strong>{i.provider}</strong></td>
                        <td>{i.policyNumber}</td>
                        <td>{i.startDate}</td>
                        <td><strong>{i.expiryDate}</strong></td>
                        <td>{formatCurrency(i.premium)}</td>
                        <td><span className="badge badge-success">{i.status || 'ACTIVE'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="sf-card">
          <div className="sf-card-header">
            <h3 className="sf-card-title">Vehicle Compliance Documents</h3>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {documents.length === 0 ? (
              <EmptyState title="No documents found" description="No legal documents filed for this vehicle yet." />
            ) : (
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Document Type</th>
                      <th>Document Number</th>
                      <th>Issue Date</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.id}>
                        <td><span className="badge badge-primary">{d.documentType}</span></td>
                        <td><strong>{d.documentNumber}</strong></td>
                        <td>{d.issueDate || '—'}</td>
                        <td><strong>{d.expiryDate || '—'}</strong></td>
                        <td><span className="badge badge-success">{d.status || 'VALID'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: FASTAG */}
      {activeTab === 'fastag' && (
        <div className="sf-card">
          <div className="sf-card-header">
            <h3 className="sf-card-title">FASTag Toll Tag</h3>
          </div>
          <div className="sf-card-body">
            {fastags.length === 0 ? (
              <EmptyState title="No FASTag attached" description="No electronic toll tag configured for this vehicle." />
            ) : (
              fastags.map((ft) => (
                <div key={ft.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Provider</span>
                    <div style={{ fontWeight: 600 }}>{ft.provider}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tag ID / Number</span>
                    <div style={{ fontWeight: 600 }}>{ft.fastagNumber}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Balance</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: ft.balance <= ft.minimumBalance ? 'var(--danger)' : 'var(--success)' }}>
                      {formatCurrency(ft.balance)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Min. Balance Alert Threshold</span>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(ft.minimumBalance)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="sf-card">
          <div className="sf-card-header">
            <h3 className="sf-card-title">Expense Log</h3>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {expenses.length === 0 ? (
              <EmptyState title="No expenses recorded" description="No fuel, parking, or general expense logged." />
            ) : (
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td>{e.expenseDate}</td>
                        <td><span className="badge badge-info">{e.expenseType}</span></td>
                        <td><strong>{formatCurrency(e.amount)}</strong></td>
                        <td>{e.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: TRIPS (Business Only) */}
      {isBusiness && activeTab === 'trips' && (
        <div className="sf-card">
          <div className="sf-card-header">
            <h3 className="sf-card-title">Trip History</h3>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {trips.length === 0 ? (
              <EmptyState title="No trips dispatched" description="No trips logged under this vehicle." />
            ) : (
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Route</th>
                      <th>Driver</th>
                      <th>Freight</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((t) => (
                      <tr key={t.id}>
                        <td>{t.tripDate}</td>
                        <td><strong>{t.pickupLocation} &rarr; {t.dropLocation}</strong></td>
                        <td>{t.driver?.name || '—'}</td>
                        <td><strong>{formatCurrency(t.totalFreight)}</strong></td>
                        <td>
                          <span className={`badge ${t.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                            {t.status}
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
    </div>
  );
}

