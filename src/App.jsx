import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Public Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard Router
import Dashboard from './pages/Dashboard';

// Personal Mode Pages
import PersonalDashboard from './pages/PersonalDashboard';
import Vehicles from './pages/Vehicles';
import VehicleDetails from './pages/VehicleDetails';
import Finance from './pages/Finance';
import Maintenance from './pages/Maintenance';
import Insurance from './pages/Insurance';
import Documents from './pages/Documents';
import Fastag from './pages/Fastag';
import Expenses from './pages/Expenses';

// Business Mode Pages
import BusinessDashboard from './pages/BusinessDashboard';
import Drivers from './pages/Drivers';
import Customers from './pages/Customers';
import Trips from './pages/Trips';
import TripExpenses from './pages/TripExpenses';
import BusinessPayments from './pages/BusinessPayments';
import Invoices from './pages/Invoices';
import ProfitLoss from './pages/ProfitLoss';
import VoiceReminders from './pages/VoiceReminders';
import VoiceCalls from './pages/VoiceCalls';

// Shared Pages
import Reminders from './pages/Reminders';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes inside Main App Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Central Dynamic Dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />

              {/* Personal Mode Routes */}
              <Route path="/personal/dashboard" element={<PersonalDashboard />} />
              <Route path="/personal/vehicles" element={<Vehicles />} />
              <Route path="/personal/vehicles/:id" element={<VehicleDetails />} />
              <Route path="/personal/finance" element={<Finance />} />
              <Route path="/personal/maintenance" element={<Maintenance />} />
              <Route path="/personal/insurance" element={<Insurance />} />
              <Route path="/personal/documents" element={<Documents />} />
              <Route path="/personal/fastag" element={<Fastag />} />
              <Route path="/personal/expenses" element={<Expenses />} />
              <Route path="/personal/reminders" element={<Reminders />} />
              <Route path="/personal/notifications" element={<Notifications />} />

              {/* Business Mode Routes */}
              <Route path="/business/dashboard" element={<BusinessDashboard />} />
              <Route path="/business/fleet" element={<Vehicles isFleet={true} />} />
              <Route path="/business/fleet/:id" element={<VehicleDetails />} />
              <Route path="/business/drivers" element={<Drivers />} />
              <Route path="/business/customers" element={<Customers />} />
              <Route path="/business/trips" element={<Trips />} />
              <Route path="/business/trip-expenses" element={<TripExpenses />} />
              <Route path="/business/payments" element={<BusinessPayments />} />
              <Route path="/business/invoices" element={<Invoices />} />
              <Route path="/business/profit-loss" element={<ProfitLoss />} />
              <Route path="/business/reminders" element={<Reminders />} />
              <Route path="/business/notifications" element={<Notifications />} />
              <Route path="/business/voice-reminders" element={<VoiceReminders />} />
              <Route path="/business/voice-calls" element={<VoiceCalls />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}