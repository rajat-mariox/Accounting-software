export const inventoryTabs = [
  { id: 'items', label: 'Items' },
  { id: 'warehouses', label: 'Warehouses' },
  { id: 'stock', label: 'Stock' },
  { id: 'transfers', label: 'Transfers' },
];

export const inventoryItems = [
  {
    id: 'laptop-pro-15',
    name: 'Laptop Pro 15',
    unit: 'piece',
    price: 1299,
    stock: 45,
    warehouse: 'Main Warehouse',
    status: 'In Stock',
    statusTone: 'success',
  },
  {
    id: 'wireless-mouse',
    name: 'Wireless Mouse',
    unit: 'piece',
    price: 29,
    stock: 15,
    warehouse: 'Main Warehouse',
    status: 'Low Stock',
    statusTone: 'danger',
  },
  {
    id: 'usb-c-cable',
    name: 'USB-C Cable',
    unit: 'piece',
    price: 15,
    stock: 8,
    warehouse: 'West Coast Hub',
    status: 'Low Stock',
    statusTone: 'danger',
  },
  {
    id: 'monitor-27',
    name: 'Monitor 27"',
    unit: 'piece',
    price: 399,
    stock: 120,
    warehouse: 'Main Warehouse',
    status: 'In Stock',
    statusTone: 'success',
  },
  {
    id: 'keyboard-mechanical',
    name: 'Keyboard Mechanical',
    unit: 'piece',
    price: 149,
    stock: 5,
    warehouse: 'West Coast Hub',
    status: 'Low Stock',
    statusTone: 'danger',
  },
];

export const warehouseRows = [
  {
    id: 'main-warehouse',
    name: 'Main Warehouse',
    location: 'New York',
    totalItems: 3,
    totalStock: 180,
    capacity: 10000,
  },
  {
    id: 'west-coast-hub',
    name: 'West Coast Hub',
    location: 'San Francisco',
    totalItems: 2,
    totalStock: 13,
    capacity: 8000,
  },
  {
    id: 'southern-distribution',
    name: 'Southern Distribution',
    location: 'Texas',
    totalItems: 0,
    totalStock: 0,
    capacity: 6000,
  },
];

export const stockOverview = [
  { id: 'in-stock', label: 'In Stock', value: 3 },
  { id: 'low-stock', label: 'Low Stock', value: 2 },
  { id: 'out-of-stock', label: 'Out of Stock', value: 0 },
];

export const transferRows = [
  {
    id: 'tr-001',
    item: 'Laptop Pro 15',
    from: 'Main Warehouse',
    to: 'West Coast Hub',
    qty: 6,
    date: '2026-04-12',
  },
];
