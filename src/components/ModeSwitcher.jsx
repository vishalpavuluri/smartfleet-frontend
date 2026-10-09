import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconCar, IconTruck } from './Icons';

export default function ModeSwitcher() {
  const { mode, setMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);

    // If currently on a mode-specific route, redirect to the matching mode route
    const currentPath = location.pathname;
    if (newMode === 'personal') {
      if (currentPath.startsWith('/business/')) {
        // e.g., /business/dashboard -> /personal/dashboard, /business/fleet -> /personal/vehicles
        if (currentPath.includes('fleet')) {
          navigate('/personal/vehicles');
        } else if (currentPath.includes('reminders')) {
          navigate('/personal/reminders');
        } else if (currentPath.includes('notifications')) {
          navigate('/personal/notifications');
        } else {
          navigate('/personal/dashboard');
        }
      } else {
        navigate('/personal/dashboard');
      }
    } else {
      if (currentPath.startsWith('/personal/')) {
        if (currentPath.includes('vehicles')) {
          navigate('/business/fleet');
        } else if (currentPath.includes('reminders')) {
          navigate('/business/reminders');
        } else if (currentPath.includes('notifications')) {
          navigate('/business/notifications');
        } else {
          navigate('/business/dashboard');
        }
      } else {
        navigate('/business/dashboard');
      }
    }
  };

  return (
    <div className="mode-switcher" title="Switch Operating Mode">
      <button
        type="button"
        onClick={() => handleModeChange('personal')}
        className={`mode-btn ${mode === 'personal' ? 'active' : ''}`}
      >
        <IconCar size={15} />
        <span>Personal</span>
      </button>
      <button
        type="button"
        onClick={() => handleModeChange('business')}
        className={`mode-btn ${mode === 'business' ? 'active business' : ''}`}
      >
        <IconTruck size={15} />
        <span>Business</span>
      </button>
    </div>
  );
}

