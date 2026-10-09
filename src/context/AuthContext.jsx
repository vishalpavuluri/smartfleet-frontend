import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('smartfleet_token'));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('smartfleet_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [mode, setModeState] = useState(() => {
    return localStorage.getItem('smartfleet_mode') || 'personal';
  });

  const setMode = (newMode) => {
    setModeState(newMode);
    localStorage.setItem('smartfleet_mode', newMode);
  };

  const toggleMode = () => {
    const nextMode = mode === 'personal' ? 'business' : 'personal';
    setMode(nextMode);
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const data = response.data;
    // data has: { userId, name, email, token, message }
    setToken(data.token);
    const userInfo = {
      id: data.userId,
      name: data.name,
      email: data.email,
    };
    setUser(userInfo);
    localStorage.setItem('smartfleet_token', data.token);
    localStorage.setItem('smartfleet_user', JSON.stringify(userInfo));
    return data;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    return response.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('smartfleet_token');
    localStorage.removeItem('smartfleet_user');
  };

  const value = {
    token,
    user,
    mode,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    setMode,
    toggleMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

