export const reportTabs = [
  { id: 'sales', label: 'Sales' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'inventory', label: 'Inventory' },
];

export const salesTrend = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  values: [45000, 52000, 48000, 61000, 55000, 67000],
};

export const topClients = [
  { rank: 1, name: 'TechStart Inc', invoices: '1 invoices', amount: 1595.0 },
  { rank: 2, name: 'Global Traders', invoices: '1 invoices', amount: 3278.0 },
  { rank: 3, name: 'Mithu Kumar', invoices: '0 invoices', amount: 0 },
];

export const salesBreakdown = [
  { month: 'Jan', invoices: 12, totalSales: 45000, avgValue: 3750.0 },
  { month: 'Feb', invoices: 12, totalSales: 52000, avgValue: 4333.33 },
  { month: 'Mar', invoices: 12, totalSales: 48000, avgValue: 4000.0 },
  { month: 'Apr', invoices: 12, totalSales: 61000, avgValue: 5083.33 },
  { month: 'May', invoices: 12, totalSales: 55000, avgValue: 4583.33 },
  { month: 'Jun', invoices: 12, totalSales: 67000, avgValue: 5583.33 },
];

export const purchaseTrend = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  values: [32000, 38000, 35000, 42000, 39000, 45000],
};

export const inventoryDistribution = [
  { label: 'Electronics 45%', value: 45, color: '#2267b2' },
  { label: 'Cables 15%', value: 15, color: '#f59e0b' },
  { label: 'Accessories 30%', value: 30, color: '#22c55e' },
  { label: 'Others 10%', value: 10, color: '#ef4444' },
];

export const stockSummary = [
  { label: 'Total Items', value: 5, tone: 'blue' },
  { label: 'Total Stock Units', value: 184, tone: 'green' },
  { label: 'Low Stock Items', value: 3, tone: 'red' },
];
