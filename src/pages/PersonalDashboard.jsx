import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  vehicleAPI,
  financeAPI,
  maintenanceAPI,
  insuranceAPI,
  documentAPI,
  fastagAPI,
  reminderAPI,
} from '../services/api';
import PageHeader from '../components/PageHeader';
import StatCard, { formatCurrency } from '../components/StatCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import {
  IconCar,
  IconCreditCard,
  IconTool,
  IconShield,
  IconFileText,
  IconTag,
  IconClock,
  IconPlus,
} from '../components/Icons';

export default function PersonalDashboard() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [finances, setFinances] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [fastags, setFastags] = useState([]);
  const [reminders, setReminders] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [
          vehiclesRes,
          financesRes,
          maintenancesRes,
          insurancesRes,
          documentsRes,
          fastagsRes,
          remindersRes,
        ] = await Promise.allSettled([
          vehicleAPI.getAll(),
          financeAPI.getAll(),
          maintenanceAPI.getAll(),
          insuranceAPI.getAll(),
          documentAPI.getAll(),
          fastagAPI.getAll(),
          reminderAPI.getAll(),
        ]);

        if (vehiclesRes.status === 'fulfilled') setVehicles(vehiclesRes.value.data || []);
        if (financesRes.status === 'fulfilled') setFinances(financesRes.value.data || []);
        if (maintenancesRes.status === 'fulfilled') setMaintenances(maintenancesRes.value.data || []);
        if (insurancesRes.status === 'fulfilled') setInsurances(insurancesRes.value.data || []);
        if (documentsRes.status === 'fulfilled') setDocuments(documentsRes.value.data || []);
        if (fastagsRes.status === 'fulfilled') setFastags(fastagsRes.value.data || []);
        if (remindersRes.status === 'fulfilled') setReminders(remindersRes.value.data || []);
      } catch (err) {
        console.error('Error loading personal dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loader text="Loading your personal vehicle dashboard..." />;
  }

  // Safe calculated metrics
  const totalVehicles = vehicles.length;
  const activeFinances = finances.filter((f) => f.status !== 'CLOSED' && f.status !== 'PAID');
  const totalRemainingLoan = activeFinances.reduce((acc, f) => acc + (f.remainingAmount || 0), 0);

  // Check upcoming dates
  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);

  const upcomingServices = maintenances.filter((m) => {
    if (!m.nextServiceDate) return false;
    const sDate = new Date(m.nextServiceDate);
    return sDate >= today;
  });

  const expiringInsurance = insurances.filter((i) => {
    if (!i.expiryDate) return false;
    const expDate = new Date(i.expiryDate);
    return expDate <= thirtyDaysLater;
  });

  const expiringDocuments = documents.filter((d) => {
    if (!d.expiryDate) return false;
    const expDate = new Date(d.expiryDate);
    return expDate <= thirtyDaysLater;
  });

  const lowFastags = fastags.filter((f) => {
    const bal = f.balance || 0;
    const minBal = f.minimumBalance || 100;
    return bal <= minBal;
  });

  const pendingReminders = reminders.filter((r) => r.status !== 'COMPLETED');

  return (
    <div>
      <PageHeader
        title="Personal Vehicle Dashboard"
        subtitle="Overview of your cars, two-wheelers, maintenance schedules, and expenses"
        actions={
          <button onClick={() => navigate('/personal/vehicles')} className="btn btn-primary">
            <IconPlus size={16} />
            <span>Add Vehicle</span>
          </button>
        }
      />

      {/* Stat Cards Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Vehicles"
          value={totalVehicles}
          subtitle="Registered in your garage"
          icon={IconCar}
          color="blue"
        />

        <StatCard
          title="Active Loan / EMI"
          value={activeFinances.length}
          subtitle={`Total dues: ${formatCurrency(totalRemainingLoan)}`}
          icon={IconCreditCard}
          color="teal"
        />

        <StatCard
          title="Upcoming Services"
          value={upcomingServices.length}
          subtitle="Scheduled maintenance"
          icon={IconTool}
          color="amber"
        />

        <StatCard
          title="Insurance Expiring"
          value={expiringInsurance.length}
          subtitle="Within next 30 days"
          icon={IconShield}
          color={expiringInsurance.length > 0 ? 'red' : 'green'}
        />

        <StatCard
          title="Documents Expiring"
          value={expiringDocuments.length}
          subtitle="PUC, RC, Fitness"
          icon={IconFileText}
          color={expiringDocuments.length > 0 ? 'amber' : 'green'}
        />

        <StatCard
          title="FASTag Low Balance"
          value={lowFastags.length}
          subtitle="Below minimum balance"
          icon={IconTag}
          color={lowFastags.length > 0 ? 'red' : 'green'}
        />

        <StatCard
          title="Pending Reminders"
          value={pendingReminders.length}
          subtitle="Action required"
          icon={IconClock}
          color="cyan"
        />
      </div>

      {/* Content Columns */}
      <div className="grid-2">
        {/* Vehicles summary */}
        <div className="sf-card">
          <div className="sf-card-header">
            <div className="sf-card-title">
              <IconCar size={18} />
              <span>My Vehicles ({vehicles.length})</span>
            </div>
            <button
              onClick={() => navigate('/personal/vehicles')}
              className="btn btn-outline btn-sm"
            >
              View All
            </button>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {vehicles.length === 0 ? (
              <EmptyState
                title="No vehicles added yet"
                description="Add your first personal car, bike, or scooter to track expenses and maintenance."
                actionLabel="Add Vehicle"
                onAction={() => navigate('/personal/vehicles')}
              />
            ) : (
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Registration</th>
                      <th>Type / Fuel</th>
                      <th>Current KM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.slice(0, 5).map((v) => (
                      <tr
                        key={v.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/personal/vehicles?id=${v.id}`)}
                      >
                        <td>
                          <strong>{v.vehicleName}</strong>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {v.brand} {v.model}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-primary">{v.registrationNumber}</span>
                        </td>
                        <td>
                          {v.vehicleType} &bull; {v.fuelType}
                        </td>
                        <td>{Number(v.currentKm || 0).toLocaleString()} km</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Reminders / Action Center */}
        <div className="sf-card">
          <div className="sf-card-header">
            <div className="sf-card-title">
              <IconClock size={18} />
              <span>Priority Reminders ({pendingReminders.length})</span>
            </div>
            <button
              onClick={() => navigate('/personal/reminders')}
              className="btn btn-outline btn-sm"
            >
              View All
            </button>
          </div>
          <div className="sf-card-body" style={{ padding: 0 }}>
            {pendingReminders.length === 0 ? (
              <EmptyState
                title="All clear!"
                description="You have no pending reminders or urgent vehicle tasks."
                actionLabel="Add Reminder"
                onAction={() => navigate('/personal/reminders')}
              />
            ) : (
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReminders.slice(0, 5).map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.title}</strong>
                          {r.vehicle && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              {r.vehicle.vehicleName} ({r.vehicle.registrationNumber})
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              r.priority === 'URGENT'
                                ? 'badge-danger'
                                : r.priority === 'HIGH'
                                ? 'badge-warning'
                                : 'badge-neutral'
                            }`}
                          >
                            {r.priority || 'NORMAL'}
                          </span>
                        </td>
                        <td>{r.reminderDate || '—'}</td>
                        <td>
                          <span className="badge badge-warning">{r.status || 'PENDING'}</span>
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

