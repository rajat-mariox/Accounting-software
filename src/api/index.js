import { api } from './client';

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }, { auth: false }),
  register: (payload) => api.post('/auth/register', payload, { auth: false }),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }, { auth: false }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }, { auth: false }),
  resetPassword: (email, resetToken, newPassword) =>
    api.post('/auth/reset-password', { email, resetToken, newPassword }, { auth: false }),
};

export const usersApi = {
  list: () => api.get('/users'),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  remove: (id) => api.delete(`/users/${id}`),
};

export const clientsApi = {
  list: (q) => api.get(`/clients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  get: (id) => api.get(`/clients/${id}`),
  create: (payload) => api.post('/clients', payload),
  update: (id, payload) => api.put(`/clients/${id}`, payload),
  remove: (id) => api.delete(`/clients/${id}`),
};

export const suppliersApi = {
  list: () => api.get('/suppliers'),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (payload) => api.post('/suppliers', payload),
  update: (id, payload) => api.put(`/suppliers/${id}`, payload),
  remove: (id) => api.delete(`/suppliers/${id}`),
  listActivities: () => api.get('/suppliers/activities'),
  createActivity: (payload) => api.post('/suppliers/activities', payload),
};

export const inventoryApi = {
  list: () => api.get('/inventory'),
  overview: () => api.get('/inventory/overview'),
  create: (payload) => api.post('/inventory', payload),
  update: (id, payload) => api.put(`/inventory/${id}`, payload),
  remove: (id) => api.delete(`/inventory/${id}`),
};

export const warehousesApi = {
  list: () => api.get('/warehouses'),
  create: (payload) => api.post('/warehouses', payload),
  update: (id, payload) => api.put(`/warehouses/${id}`, payload),
  remove: (id) => api.delete(`/warehouses/${id}`),
};

export const transfersApi = {
  list: () => api.get('/transfers'),
  create: (payload) => api.post('/transfers', payload),
};

export const invoicesApi = {
  list: (params = {}) => {
    const search = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''));
    const qs = search.toString();
    return api.get(`/invoices${qs ? `?${qs}` : ''}`);
  },
  get: (id) => api.get(`/invoices/${id}`),
  create: (payload) => api.post('/invoices', payload),
  update: (id, payload) => api.put(`/invoices/${id}`, payload),
  setStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  remove: (id) => api.delete(`/invoices/${id}`),
};

export const paymentsApi = {
  list: () => api.get('/payments'),
  create: (payload) => api.post('/payments', payload),
  remove: (id) => api.delete(`/payments/${id}`),
};

export const auditLogsApi = {
  list: (params = {}) => {
    const search = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''));
    const qs = search.toString();
    return api.get(`/audit-logs${qs ? `?${qs}` : ''}`);
  },
};

export const settingsApi = {
  getAll: () => api.get('/settings'),
  get: (key) => api.get(`/settings/${key}`),
  update: (key, payload) => api.put(`/settings/${key}`, payload),
};

export const notificationsApi = {
  list: (params = {}) => {
    const search = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''));
    const qs = search.toString();
    return api.get(`/notifications${qs ? `?${qs}` : ''}`);
  },
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
  clearRead: () => api.delete('/notifications'),
};

export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard'),
  sales: (params = {}) => {
    const search = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''));
    const qs = search.toString();
    return api.get(`/reports/sales${qs ? `?${qs}` : ''}`);
  },
  salesVsPurchase: (months = 6) => api.get(`/reports/sales-vs-purchase?months=${months}`),
  topClients: () => api.get('/reports/top-clients'),
};
