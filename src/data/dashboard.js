import {
  AuditLogsIcon,
  ClientsIcon,
  DashboardIcon,
  InventoryIcon,
  InvoicesIcon,
  PaymentsIcon,
  ReportsIcon,
  SettingsIcon,
  SuppliersIcon,
  AddClientIcon,
  AddItemIcon,
  NewInvoiceIcon,
  RecordPaymentIcon,
  UsersRolesIcon,
} from '../components/dashboard/icons';
import {
  auditIconSrc,
  clientIconSrc,
  dashbordIconSrc,
  inventoryIconSrc,
  invoiceIconSrc,
  paymentIconSrc,
  reportIconSrc,
  settingIconSrc,
  userRoleIconSrc,
} from '../utils/images';

export const sidebarItems = [
  { label: 'Dashboard', icon: DashboardIcon, iconSrc: dashbordIconSrc, path: '/dashboard', end: true, module: 'dashboard' },
  { label: 'Clients', icon: ClientsIcon, iconSrc: clientIconSrc, path: '/clients', module: 'clients' },
  { label: 'Suppliers', icon: SuppliersIcon, path: '/suppliers', module: 'suppliers' },
  { label: 'Inventory', icon: InventoryIcon, iconSrc: inventoryIconSrc, path: '/inventory', module: 'inventory' },
  { label: 'Invoices', icon: InvoicesIcon, iconSrc: invoiceIconSrc, path: '/invoices', module: 'invoices' },
  { label: 'Payments', icon: PaymentsIcon, iconSrc: paymentIconSrc, path: '/payments', module: 'payments' },
  { label: 'Reports', icon: ReportsIcon, iconSrc: reportIconSrc, path: '/reports', module: 'reports' },
  { label: 'Users & Roles', icon: UsersRolesIcon, iconSrc: userRoleIconSrc, path: '/users-roles', module: 'users' },
  { label: 'Settings', icon: SettingsIcon, iconSrc: settingIconSrc, path: '/settings' },
  { label: 'Audit Logs', icon: AuditLogsIcon, iconSrc: auditIconSrc, path: '/audit-logs', module: 'auditLogs' },
];

export const quickActions = [
  { label: 'Add Client', icon: AddClientIcon },
  // Inventory is hidden for this milestone — restore this action when the module is re-enabled.
  // { label: 'Add Item', icon: AddItemIcon },
  { label: 'New Invoice', icon: NewInvoiceIcon },
  { label: 'Record Payment', icon: RecordPaymentIcon },
];
