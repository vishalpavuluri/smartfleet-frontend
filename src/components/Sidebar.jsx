import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconDashboard,
  IconCar,
  IconTruck,
  IconCreditCard,
  IconTool,
  IconShield,
  IconFileText,
  IconTag,
  IconReceipt,
  IconClock,
  IconBell,
  IconUser,
  IconUsers,
  IconMapPin,
  IconDollar,
  IconInvoice,
  IconTrendingUp,
  IconPhone,
  IconX,
} from './Icons';

export default function Sidebar({ isOpen, onClose }) {
  const { mode } = useAuth();

  const personalLinks = [
    { to: '/personal/dashboard', label: 'Dashboard', icon: IconDashboard },
    { to: '/personal/vehicles', label: 'My Vehicles', icon: IconCar },
    { to: '/personal/finance', label: 'Finance / EMI', icon: IconCreditCard },
    { to: '/personal/maintenance', label: 'Maintenance', icon: IconTool },
    { to: '/personal/insurance', label: 'Insurance', icon: IconShield },
    { to: '/personal/documents', label: 'Documents', icon: IconFileText },
    { to: '/personal/fastag', label: 'FASTag & Tolls', icon: IconTag },
    { to: '/personal/expenses', label: 'General Expenses', icon: IconReceipt },
    { to: '/personal/reminders', label: 'Reminders', icon: IconClock },
    { to: '/personal/notifications', label: 'Notifications', icon: IconBell },
    { to: '/profile', label: 'Profile', icon: IconUser },
  ];

  const businessLinks = [
    { to: '/business/dashboard', label: 'Dashboard', icon: IconDashboard },
    { to: '/business/fleet', label: 'Fleet Management', icon: IconTruck },
    { to: '/business/drivers', label: 'Drivers', icon: IconUsers },
    { to: '/business/customers', label: 'Customers', icon: IconUsers },
    { to: '/business/trips', label: 'Trips & Freight', icon: IconMapPin },
    { to: '/business/trip-expenses', label: 'Trip Expenses', icon: IconReceipt },
    { to: '/business/payments', label: 'Payments Received', icon: IconDollar },
    { to: '/business/invoices', label: 'Invoices', icon: IconInvoice },
    { to: '/business/profit-loss', label: 'Profit / Loss Report', icon: IconTrendingUp },
    { to: '/business/reminders', label: 'Reminders', icon: IconClock },
    { to: '/business/notifications', label: 'Notifications', icon: IconBell },
    { to: '/business/voice-reminders', label: 'Voice Reminders', icon: IconPhone },
    { to: '/business/voice-calls', label: 'Voice Call Log', icon: IconPhone },
    { to: '/profile', label: 'Business Profile', icon: IconUser },
  ];

  const navLinks = mode === 'business' ? businessLinks : personalLinks;

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
          <div className="brand-badge" style={{ fontSize: '1.15rem' }}>
            <div className="brand-icon">
              {mode === 'business' ? <IconTruck size={18} /> : <IconCar size={18} />}
            </div>
            <span>{mode === 'business' ? 'Fleet Ops' : 'Personal Fleet'}</span>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{ border: 'none', background: 'transparent', display: 'none' }}
            id="mobile-close-sidebar-btn"
            title="Close navigation"
          >
            <IconX size={18} />
          </button>
        </div>

        <nav className="sidebar-menu">
          <div className="sidebar-heading">
            {mode === 'business' ? 'Transport Business' : 'Vehicle Management'}
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
            SmartFleet Platform v1.0
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            #mobile-close-sidebar-btn {
              display: inline-flex !important;
            }
          }
        `}</style>
      </aside>
    </>
  );
}

