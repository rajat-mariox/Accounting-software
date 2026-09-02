// Frontend mirror of accounting-backend/src/config/permissions.js.
// Keep the two files in sync when adding modules or actions.

export const ACTIONS = ['view', 'create', 'edit', 'delete'];

export const PERMISSION_MODULES = [
  { key: 'dashboard', label: 'Dashboard', actions: ['view'] },
  { key: 'clients', label: 'Clients', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'suppliers', label: 'Suppliers', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'inventory', label: 'Inventory', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'invoices', label: 'Invoices', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'payments', label: 'Payments', actions: ['view', 'create', 'delete'] },
  { key: 'reports', label: 'Reports', actions: ['view'] },
  { key: 'users', label: 'Users & Roles', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'settings', label: 'Settings', actions: ['view', 'edit'] },
  { key: 'auditLogs', label: 'Audit Logs', actions: ['view'] },
];

function fullPermissions() {
  const out = {};
  for (const module of PERMISSION_MODULES) out[module.key] = [...module.actions];
  return out;
}

function viewOnlyPermissions() {
  const out = {};
  for (const module of PERMISSION_MODULES) out[module.key] = ['view'];
  return out;
}

export const ROLE_PRESETS = {
  Administrator: fullPermissions(),
  Manager: viewOnlyPermissions(),
  Accountant: {
    dashboard: ['view'],
    clients: ['view', 'create'],
    invoices: ['view', 'create', 'edit'],
    payments: ['view', 'create'],
    reports: ['view'],
  },
  // Client portal login: own invoices and payments only.
  Client: {
    invoices: ['view'],
    payments: ['view'],
  },
};

// Resolve the grid that applies to a user object (Administrator = everything;
// stored grid otherwise; role preset for users saved before the grid existed).
export function resolvePermissions(user) {
  if (!user) return {};
  if (user.role === 'Administrator') return fullPermissions();
  if (user.permissions && typeof user.permissions === 'object' && Object.keys(user.permissions).length > 0) {
    return user.permissions;
  }
  return ROLE_PRESETS[user.role] || {};
}
