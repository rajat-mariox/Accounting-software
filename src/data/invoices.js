import { inventoryItems } from './inventory';

export const invoiceClients = [
  { id: 'acme-corp', name: 'Acme Corp' },
  { id: 'techstart-inc', name: 'TechStart Inc' },
  { id: 'global-traders', name: 'Global Traders' },
];

export const invoiceCatalog = inventoryItems.map((item) => ({
  id: item.id,
  name: item.name,
  price: item.price,
  stock: item.stock,
}));

export const invoiceRows = [
  {
    id: 'inv1',
    client: 'Acme Corp',
    createdDate: '2026-04-01',
    dueDate: '2026-04-15',
    amount: 11533.5,
    status: 'paid',
    tone: 'paid',
    items: [
      { name: 'Laptop Pro 15', quantity: 5, price: 1299 },
      { name: 'Monitor 27"', quantity: 10, price: 399 },
    ],
  },
  {
    id: 'inv2',
    client: 'TechStart Inc',
    createdDate: '2026-04-08',
    dueDate: '2026-04-22',
    amount: 1595,
    status: 'pending',
    tone: 'pending',
    items: [{ name: 'Laptop Pro 15', quantity: 1, price: 1299 }],
  },
  {
    id: 'inv3',
    client: 'Global Traders',
    createdDate: '2026-03-20',
    dueDate: '2026-04-05',
    amount: 3278,
    status: 'overdue',
    tone: 'overdue',
    items: [{ name: 'USB-C Cable', quantity: 32, price: 15 }],
  },
];
