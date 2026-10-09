import React from 'react';
import { useAuth } from '../context/AuthContext';
import PersonalDashboard from './PersonalDashboard';
import BusinessDashboard from './BusinessDashboard';

export default function Dashboard() {
  const { mode } = useAuth();

  return mode === 'business' ? <BusinessDashboard /> : <PersonalDashboard />;
}

