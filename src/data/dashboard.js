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
  HelpIcon,
  AddClientIcon,
  AddItemIcon,
  NewInvoiceIcon,
  RecordPaymentIcon,
  SalesMetricIcon,
  PurchaseMetricIcon,
  PendingMetricIcon,
  StockMetricIcon,
  WarningIcon,
  InvoiceAlertIcon,
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
} from '../utils/images';

export const sidebarItems = [
  { label: 'Dashboard', icon: DashboardIcon, iconSrc: dashbordIconSrc, path: '/dashboard', end: true },
  { label: 'Clients', icon: ClientsIcon, iconSrc: clientIconSrc, path: '/clients' },
  { label: 'Suppliers', icon: SuppliersIcon, path: '/suppliers' },
  { label: 'Inventory', icon: InventoryIcon, iconSrc: inventoryIconSrc, path: '/inventory' },
  { label: 'Invoices', icon: InvoicesIcon, iconSrc: invoiceIconSrc, path: '/invoices' },
  { label: 'Payments', icon: PaymentsIcon, iconSrc: paymentIconSrc, path: '/payments' },
  { label: 'Reports', icon: ReportsIcon, iconSrc: reportIconSrc, path: '/reports' },
  { label: 'Settings', icon: SettingsIcon, iconSrc: settingIconSrc, path: '/settings' },
  { label: 'Audit Logs', icon: AuditLogsIcon, iconSrc: auditIconSrc, path: '/audit-logs' },
];

export const alerts = [
  {
    variant: 'warning',
    icon: WarningIcon,
    title: 'Low Stock Alert',
    description: '3 items are running low on stock. Click to view details.',
    cta: 'View Items',
  },
  {
    variant: 'danger',
    icon: InvoiceAlertIcon,
    title: 'Overdue Invoices',
    description: 'You have 1 overdue invoices that need attention.',
    cta: 'View Invoices',
  },
];

export const quickActions = [
  { label: 'Add Client', icon: AddClientIcon },
  { label: 'Add Item', icon: AddItemIcon },
  { label: 'New Invoice', icon: NewInvoiceIcon },
  { label: 'Record Payment', icon: RecordPaymentIcon },
];

export const metrics = [
  {
    label: 'Total Sales',
    value: 16406.5,
    change: '+12.5%',
    trend: 'up',
    icon: SalesMetricIcon,
  },
  {
    label: 'Total Purchase',
    value: 125000,
    change: '+8.2%',
    trend: 'up',
    icon: PurchaseMetricIcon,
  },
  {
    label: 'Pending Payments',
    value: 4873,
    change: '-3.1%',
    trend: 'down',
    icon: PendingMetricIcon,
  },
  {
    label: 'Low Stock Alert',
    value: 3,
    change: '3 items',
    trend: 'neutral',
    icon: StockMetricIcon,
  },
];

export const salesVsPurchase = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  sales: [48, 53, 50, 61, 58, 69],
  purchases: [37, 40, 36, 42, 39, 45],
};

export const monthlyRevenue = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  values: [12, 13, 12, 18, 15, 20],
};

export const lowStockAlerts = [
  { name: 'Wireless Mouse', stock: 'Current stock: 15 piece', badge: 'Low Stock' },
  { name: 'USB-C Cable', stock: 'Current stock: 8 piece', badge: 'Low Stock' },
  { name: 'Keyboard Mechanical', stock: 'Current stock: 5 piece', badge: 'Low Stock' },
];

export const pendingPayments = [
  { id: 'inv2', dueDate: '2026-04-22', amount: 1595.0, status: 'pending', tone: 'pending' },
  { id: 'inv3', dueDate: '2026-04-05', amount: 3278.0, status: 'overdue', tone: 'overdue' },
];

export const recentActivity = [
  { invoiceId: 'inv1', date: '2026-04-01', amount: 1533.5, status: 'paid' },
  { invoiceId: 'inv2', date: '2026-04-08', amount: 1595.0, status: 'pending' },
  { invoiceId: 'inv3', date: '2026-03-30', amount: 3278.0, status: 'overdue' },
];

export const notifications = [
  {
    id: 'n1',
    tone: 'warning',
    title: 'Low Stock Alert',
    description: 'Wireless Mouse is running low (15 units)',
  },
  {
    id: 'n2',
    tone: 'warning',
    title: 'Low Stock Alert',
    description: 'USB-C Cable is running low (8 units)',
  },
  {
    id: 'n3',
    tone: 'warning',
    title: 'Low Stock Alert',
    description: 'Keyboard Mechanical is running low (5 units)',
  },
  {
    id: 'n4',
    tone: 'info',
    title: 'Pending Payment',
    description: 'Invoice inv2 - $1595.00',
  },
  {
    id: 'n5',
    tone: 'danger',
    title: 'Overdue Invoice',
    description: 'Invoice inv3 is overdue - $3278.00',
  },
];
