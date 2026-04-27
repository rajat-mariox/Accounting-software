import { invoiceRows } from './invoices';

export const paymentRows = [
  {
    id: 'pay-001',
    invoiceId: 'inv1',
    date: '2026-04-10',
    amount: 11533.5,
    mode: 'Bank Transfer',
    reference: 'TXN-001',
  },
];

export const paymentInvoices = invoiceRows.map((invoice) => ({
  id: invoice.id,
  client: invoice.client,
  amount: invoice.amount,
  status: invoice.status,
}));

export const paymentModes = ['Bank Transfer', 'Cash', 'Card', 'Cheque'];
