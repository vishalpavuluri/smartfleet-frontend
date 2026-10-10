import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartfleet_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401/403 errors and standardize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        // Token expired or invalid
        localStorage.removeItem('smartfleet_token');
        localStorage.removeItem('smartfleet_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login?sessionExpired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Helper to extract clear error message from backend response
export const getErrorMessage = (error, fallback = 'An unexpected error occurred') => {
  if (!error) return fallback;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return error.response.data.error;
  if (typeof error.response?.data === 'string') return error.response.data;
  if (error.message) return error.message;
  return fallback;
};

// ============================================================================
// API MODULES
// ============================================================================

// Authentication
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
};

// Vehicles
export const vehicleAPI = {
  getAll: () => api.get('/api/vehicles'),
  create: (data) => api.post('/api/vehicles', data),
};

// Finance / EMI
export const financeAPI = {
  getAll: () => api.get('/api/finance'),
  create: (data) => api.post('/api/finance', data),
};

// Finance Payments
export const financePaymentAPI = {
  getAll: () => api.get('/api/finance-payments'),
  create: (data) => api.post('/api/finance-payments', data),
};

// Maintenance
export const maintenanceAPI = {
  getAll: () => api.get('/api/maintenance'),
  create: (data) => api.post('/api/maintenance', data),
};

// Insurance
export const insuranceAPI = {
  getAll: () => api.get('/api/insurance'),
  create: (data) => api.post('/api/insurance', data),
};

// Vehicle Documents
export const documentAPI = {
  getAll: () => api.get('/api/documents'),
  create: (data) => api.post('/api/documents', data),
};

// FASTag & FASTag Transactions
export const fastagAPI = {
  getAll: () => api.get('/api/fastag'),
  create: (data) => api.post('/api/fastag', data),
  getTransactions: () => api.get('/api/fastag-transactions'),
  createTransaction: (data) => api.post('/api/fastag-transactions', data),
};

// General Expenses
export const expenseAPI = {
  getAll: () => api.get('/api/expenses'),
  create: (data) => api.post('/api/expenses', data),
};

// Drivers (Business Mode)
export const driverAPI = {
  getAll: () => api.get('/api/drivers'),
  create: (data) => api.post('/api/drivers', data),
};

// Customers (Business Mode)
export const customerAPI = {
  getAll: () => api.get('/api/customers'),
  create: (data) => api.post('/api/customers', data),
};

// Trips (Business Mode)
export const tripAPI = {
  getAll: () => api.get('/api/trips'),
  create: (data) => api.post('/api/trips', data),
  complete: (id) => api.put(`/api/trips/${id}/complete`),
};

// Trip Expenses
export const tripExpenseAPI = {
  getAll: () => api.get('/api/trip-expenses'),
  create: (data) => api.post('/api/trip-expenses', data),
};

// Business Payments
export const businessPaymentAPI = {
  getAll: () => api.get('/api/business-payments'),
  create: (data) => api.post('/api/business-payments', data),
};

// Invoices
export const invoiceAPI = {
  getAll: () => api.get('/api/invoices'),
  create: (data) => api.post('/api/invoices', data),
};

// Monthly Financial Profit/Loss Dashboard
export const dashboardAPI = {
  getMonthlyProfit: (month) => api.get(`/api/dashboard/monthly-profit?month=${month}`),
};

// Reminders
export const reminderAPI = {
  getAll: () => api.get('/api/reminders'),
  create: (data) => api.post('/api/reminders', data),
  complete: (id) => api.put(`/api/reminders/${id}/complete`),
};

// Notifications
export const notificationAPI = {
  getAll: () => api.get('/api/notifications'),
  getUnread: () => api.get('/api/notifications/unread'),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
};

// Voice Reminders
export const voiceReminderAPI = {
  getPreference: () => api.get('/api/voice-reminders'),
  savePreference: (data) => api.post('/api/voice-reminders', data),
  enable: () => api.put('/api/voice-reminders/enable'),
  disable: () => api.put('/api/voice-reminders/disable'),
};

// Voice Call Logs
export const voiceCallAPI = {
  getLogs: () => api.get('/api/voice-calls'),
  createCallLog: (reminderId) => api.post(`/api/voice-calls/reminder/${reminderId}`),
  updateStatus: (id, status) => api.put(`/api/voice-calls/${id}/status?status=${status}`),
};

export default api;

