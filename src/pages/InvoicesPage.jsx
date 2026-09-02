import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import AlertBanner from '../components/dashboard/AlertBanner';
import { CloseIcon, TrashIcon, WarningIcon, InvoiceAlertIcon } from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { paymentModes } from '../data/payments';
import { invoicesApi, clientsApi, inventoryApi } from '../api';
import { can, getStoredUser } from '../utils/auth';
import {
  isDueAfterCreated,
  isNonEmpty,
  isPositiveInteger,
  isValidISODate,
} from '../utils/validators';
import useDebouncedValue from '../utils/useDebouncedValue';
import {
  invoicePlusIconSrc,
  invoiceTotalIconSrc,
  invoicePaidIconSrc,
  invoicePendingIconSrc,
  invoiceSearchIconSrc,
  invoiceDownloadIconSrc,
  invoiceChevronIconSrc,
  invoiceModalChevronIconSrc,
  invoiceAddItemIconSrc,
  invoiceEmptyPlusIconSrc,
  invoiceDetailUserIconSrc,
  invoiceDetailCalendarIconSrc,
  invoiceDeleteTrashIconSrc,
} from '../utils/images';
import jgcHeaderSrc from '../utils/images/jgc-header.png?inline';
import jgcFooterSrc from '../utils/images/jgc-footer.png?inline';
import html2pdf from 'html2pdf.js';
import '../styles/dashboard.css';
import '../styles/invoices.css';
import '../styles/form-errors.css';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Mirrors Invoice.computeTotals on the backend: subtotal -> discount -> tax on discounted amount.
function computeTotals(items, discountPercent, taxRate) {
  const subtotal = round2(items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0));
  const discountAmount = round2(subtotal * (Number(discountPercent) || 0) / 100);
  const taxable = round2(subtotal - discountAmount);
  const taxAmount = round2(taxable * (Number(taxRate) || 0) / 100);
  return { subtotal, discountAmount, taxable, taxAmount, total: round2(taxable + taxAmount) };
}

function isPercent(value) {
  if (value === '' || value === undefined || value === null) return true;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

function invoiceBalance(invoice) {
  if (!invoice) return 0;
  if (typeof invoice.balance === 'number') return invoice.balance;
  return Math.max(0, round2(Number(invoice.amount || 0) - Number(invoice.amountPaid || 0)));
}

const STATUS_LABEL = {
  paid: 'paid',
  partial: 'partially paid',
  pending: 'pending',
  overdue: 'overdue',
  cancelled: 'cancelled',
};

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ONES_WORDS = [
  '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
  'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN',
];
const TENS_WORDS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

function numberToWords(value) {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return 'ZERO';
  const below1000 = (num) => {
    let words = '';
    if (num >= 100) {
      words += `${ONES_WORDS[Math.floor(num / 100)]} HUNDRED`;
      num %= 100;
      if (num) words += ' ';
    }
    if (num >= 20) {
      words += TENS_WORDS[Math.floor(num / 10)];
      if (num % 10) words += `-${ONES_WORDS[num % 10]}`;
    } else if (num > 0) {
      words += ONES_WORDS[num];
    }
    return words;
  };
  const scales = [
    [1000000000, 'BILLION'],
    [1000000, 'MILLION'],
    [1000, 'THOUSAND'],
  ];
  let remainder = n;
  const parts = [];
  for (const [scale, label] of scales) {
    if (remainder >= scale) {
      parts.push(`${below1000(Math.floor(remainder / scale))} ${label}`);
      remainder %= scale;
    }
  }
  if (remainder > 0) parts.push(below1000(remainder));
  return parts.join(' ');
}

function amountInWords(amount) {
  const total = Math.round((Number(amount) || 0) * 100);
  const dollars = Math.floor(total / 100);
  const cents = total % 100;
  const dollarWords = `${numberToWords(dollars)} ${dollars === 1 ? 'DOLLAR' : 'DOLLARS'}`;
  if (!cents) return `${dollarWords} ONLY`;
  return `${dollarWords} AND ${numberToWords(cents)} ${cents === 1 ? 'CENT' : 'CENTS'} ONLY`;
}

function formatDocMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDocDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

function buildInvoiceHtml(invoice, client) {
  const number = invoice.invoiceNumber || invoice.id;
  const items = invoice.items || [];
  const rows = items
    .map(
      (item, index) => `
      <tr>
        <td class="c">${index + 1}</td>
        <td>${escapeHtml(item.name).toUpperCase()}</td>
        <td class="r">${formatDocMoney(item.price)}</td>
        <td class="c">${escapeHtml(item.unit || 'Pcs')}</td>
        <td class="c">${escapeHtml(item.quantity)}</td>
        <td class="r">${item.price * item.quantity ? formatDocMoney(item.price * item.quantity) : '$&nbsp;&nbsp;&nbsp;-'}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Invoice ${escapeHtml(number)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Cambria', 'Georgia', 'Times New Roman', serif; color: #111; margin: 0; background: #fff; }
  .page { max-width: 820px; margin: 0 auto; display: flex; flex-direction: column; min-height: 100vh; }
  .banner { display: block; width: 100%; height: auto; }
  .banner--header { margin-bottom: 26px; }
  .content { padding: 0 32px; }
  table.doc { width: 100%; border-collapse: collapse; }
  table.doc td, table.doc th { border: 1.5px solid #111; padding: 6px 10px; font-size: 14px; vertical-align: top; }
  .label { font-weight: 700; }
  .u { text-decoration: underline; }
  .red { color: #e02020; }
  .title-cell { text-align: center; vertical-align: middle !important; font-size: 24px; font-weight: 700; }
  .c { text-align: center; }
  .r { text-align: right; }
  table.items td, table.items th { vertical-align: middle; }
  table.items th { background: #eee; text-align: center; font-size: 13px; }
  table.items th.desc { font-style: italic; color: #4472c4; font-weight: 600; font-size: 16px; }
  .total-row td { font-size: 17px; font-weight: 700; }
  .words-row td { padding: 16px 12px; text-align: center; font-weight: 700; }
  .footer { margin-top: auto; padding-top: 26px; }
  @media print { .page { min-height: auto; } body { margin: 0; } }
</style>
</head>
<body>
<div class="page">
  <img class="banner banner--header" src="${jgcHeaderSrc}" alt="Jubba Group of Companies" />

  <div class="content">
  <table class="doc">
    <tr>
      <td class="label u" style="width:52%">ISSUER</td>
      <td class="title-cell red" colspan="2" rowspan="2">COMMERCIAL INVOICE</td>
    </tr>
    <tr>
      <td>
        <div class="label u">JUBBA GROUP OF COMPANIES</div>
        <div>814 MAKKA MUKARAMA STREET WABERI DISTRICT MOGADISHU SOMALIA</div>
      </td>
    </tr>
    <tr>
      <td class="label">TO: ${escapeHtml((invoice.clientName || '').toUpperCase())}</td>
      <td class="label" style="width:23%">INVOICE NO.</td>
      <td class="c" style="width:25%">${escapeHtml(number)}</td>
    </tr>
    <tr>
      <td class="label u">${escapeHtml((invoice.clientName || '').toUpperCase())}</td>
      <td class="label">DATE OF ISSUE</td>
      <td class="c">${escapeHtml(formatDocDate(invoice.createdDate))}</td>
    </tr>
    <tr>
      <td>${escapeHtml(client?.address || '')}</td>
      <td class="label">DUE DATE</td>
      <td class="c">${escapeHtml(formatDocDate(invoice.dueDate))}</td>
    </tr>
    <tr>
      <td class="label" colspan="1">STATUS</td>
      <td colspan="2" style="text-transform:uppercase">${escapeHtml(invoice.status || '')}</td>
    </tr>
    ${invoice.notes ? `<tr><td class="label">NOTES</td><td colspan="2">${escapeHtml(invoice.notes)}</td></tr>` : ''}
  </table>

  <table class="doc items" style="margin-top:-1.5px">
    <thead>
      <tr>
        <th style="width:7%">ITEM</th>
        <th class="desc">Description</th>
        <th style="width:12%">UNIT<br/>PRICE</th>
        <th style="width:12%">UNIT</th>
        <th style="width:9%">QTY</th>
        <th style="width:16%">AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="6" class="c">No items</td></tr>'}
      ${Number(invoice.discountAmount) > 0 || Number(invoice.taxAmount) > 0 ? `
      <tr>
        <td colspan="3"></td>
        <td class="c">SUBTOTAL</td>
        <td class="c">USD</td>
        <td class="r">${formatDocMoney(invoice.subtotal ?? invoice.amount)}</td>
      </tr>` : ''}
      ${Number(invoice.discountAmount) > 0 ? `
      <tr>
        <td colspan="3"></td>
        <td class="c">DISCOUNT ${escapeHtml(String(invoice.discountPercent || 0))}%</td>
        <td class="c">USD</td>
        <td class="r">-${formatDocMoney(invoice.discountAmount)}</td>
      </tr>` : ''}
      ${Number(invoice.taxAmount) > 0 ? `
      <tr>
        <td colspan="3"></td>
        <td class="c">TAX ${escapeHtml(String(invoice.taxRate || 0))}%</td>
        <td class="c">USD</td>
        <td class="r">${formatDocMoney(invoice.taxAmount)}</td>
      </tr>` : ''}
      <tr class="total-row">
        <td colspan="3"></td>
        <td class="c red">TOTAL</td>
        <td class="c red">USD</td>
        <td class="r red">${formatDocMoney(invoice.amount)}</td>
      </tr>
      ${Number(invoice.amountPaid) > 0 && Number(invoice.amountPaid) < Number(invoice.amount) ? `
      <tr>
        <td colspan="3"></td>
        <td class="c">PAID</td>
        <td class="c">USD</td>
        <td class="r">${formatDocMoney(invoice.amountPaid)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="3"></td>
        <td class="c red">BALANCE DUE</td>
        <td class="c red">USD</td>
        <td class="r red">${formatDocMoney(Number(invoice.amount) - Number(invoice.amountPaid))}</td>
      </tr>
      ${invoice.nextPaymentDate ? `
      <tr>
        <td colspan="3"></td>
        <td class="c">NEXT PAYMENT</td>
        <td colspan="2" class="c">${escapeHtml(formatDocDate(invoice.nextPaymentDate))}</td>
      </tr>` : ''}` : ''}
      <tr class="words-row">
        <td colspan="2" class="red">AMOUNT IN<br/>WORDS</td>
        <td colspan="4" class="red">${escapeHtml(amountInWords(invoice.amount))}</td>
      </tr>
    </tbody>
  </table>
  </div>

  <div class="footer">
    <img class="banner" src="${jgcFooterSrc}" alt="Contact: 0619998770 / 0616111139, Info@jubbagroup.so, Mogadishu Somalia" />
  </div>
</div>
</body>
</html>`;
}

async function downloadInvoice(invoice, client) {
  const html = buildInvoiceHtml(invoice, client);
  // Render the invoice in a hidden iframe so its styles cannot clash with the app,
  // then convert that document to a real PDF.
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '820px';
  iframe.style.height = '1160px';
  document.body.appendChild(iframe);
  try {
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();
    await new Promise((resolve) => {
      if (doc.readyState === 'complete') {
        setTimeout(resolve, 150);
      } else {
        iframe.onload = () => setTimeout(resolve, 150);
      }
    });
    await html2pdf()
      .set({
        margin: 0,
        filename: `${invoice.invoiceNumber || invoice.id}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 820 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(doc.body)
      .save();
  } finally {
    document.body.removeChild(iframe);
  }
}

function validateInvoiceForm(form, draftItems) {
  const errors = {};
  if (!isNonEmpty(form.clientId)) errors.clientId = 'Select a client.';
  if (!isValidISODate(form.createdDate)) {
    errors.createdDate = 'Use the YYYY-MM-DD format.';
  }
  if (!isValidISODate(form.dueDate)) {
    errors.dueDate = 'Use the YYYY-MM-DD format.';
  } else if (isValidISODate(form.createdDate) && !isDueAfterCreated(form.createdDate, form.dueDate)) {
    errors.dueDate = 'Due date must be on or after created date.';
  }
  if (!draftItems.length) {
    errors.items = 'Add at least one item to the invoice.';
  }
  if (!isPercent(form.discountPercent)) errors.discountPercent = 'Discount must be between 0 and 100.';
  if (!isPercent(form.taxRate)) errors.taxRate = 'Tax rate must be between 0 and 100.';
  if (form.payNow) {
    const total = computeTotals(draftItems, form.discountPercent, form.taxRate).total;
    const paid = Number(form.amountPaidNow);
    if (!isNonEmpty(form.amountPaidNow) || !Number.isFinite(paid) || paid <= 0) {
      errors.amountPaidNow = 'Enter the amount the client is paying now.';
    } else if (paid > total) {
      errors.amountPaidNow = `Amount cannot exceed the invoice total of ${formatInvoiceMoney(total)}.`;
    }
  }
  if (isNonEmpty(form.nextPaymentDate)) {
    if (!isValidISODate(form.nextPaymentDate)) {
      errors.nextPaymentDate = 'Use the YYYY-MM-DD format.';
    } else if (isValidISODate(form.createdDate) && !isDueAfterCreated(form.createdDate, form.nextPaymentDate)) {
      errors.nextPaymentDate = 'Next payment date must be on or after created date.';
    }
  }
  return errors;
}

export default function InvoicesPage({ initialAction }) {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [isModalOpen, setIsModalOpen] = useState(initialAction === 'add');
  const [modalMode, setModalMode] = useState(initialAction === 'add' ? 'create' : null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [createForm, setCreateForm] = useState({ clientId: '', createdDate: todayISO(), dueDate: '', itemId: '', quantity: '1', discountPercent: '0', taxRate: '0', payNow: false, amountPaidNow: '', paymentMode: paymentModes[0], nextPaymentDate: '' });
  const [draftItems, setDraftItems] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createErrors, setCreateErrors] = useState({});
  const [addItemError, setAddItemError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const canCreate = can('invoices', 'create');
    Promise.all([
      invoicesApi.list(),
      canCreate ? clientsApi.list() : Promise.resolve([]),
      canCreate ? inventoryApi.list() : Promise.resolve([]),
    ])
      .then(([invoiceRows, clientRows, itemRows]) => {
        if (cancelled) return;
        setInvoices(invoiceRows);
        setClients(clientRows);
        setCatalog(itemRows);
      })
      .catch((err) => !cancelled && setLoadError(err.message || 'Failed to load invoices'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredInvoices = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return invoices;
    return invoices.filter((invoice) =>
      [invoice.invoiceNumber, invoice.clientName, invoice.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [invoices, debouncedSearch]);

  const stats = useMemo(() => {
    const paid = invoices.filter((invoice) => invoice.status === 'paid').length;
    const pending = invoices.filter((invoice) => invoice.status !== 'paid').length;
    return [
      { label: 'Total Invoices', value: invoices.length, iconSrc: invoiceTotalIconSrc, tone: 'blue' },
      { label: 'Paid', value: paid, iconSrc: invoicePaidIconSrc, tone: 'green' },
      { label: 'Pending', value: pending, iconSrc: invoicePendingIconSrc, tone: 'red' },
    ];
  }, [invoices]);

  const draftTotals = useMemo(
    () => computeTotals(draftItems, createForm.discountPercent, createForm.taxRate),
    [draftItems, createForm.discountPercent, createForm.taxRate],
  );

  // Client-portal reminders: unpaid balances that are overdue or due within 3 days.
  // Staff get the equivalent on the dashboard; clients land here, so show it here.
  const isClientUser = getStoredUser()?.role === 'Client';
  const [dismissedReminders, setDismissedReminders] = useState(() => new Set());
  const reminders = useMemo(() => {
    if (!isClientUser) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soon = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);
    const open = invoices.filter((inv) => !['paid', 'cancelled'].includes(inv.status) && invoiceBalance(inv) > 0);
    const overdue = open.filter((inv) => new Date(inv.dueDate) < today);
    const dueSoon = open.filter((inv) => {
      const due = new Date(inv.dueDate);
      return due >= today && due < soon;
    });
    const sum = (rows) => rows.reduce((total, inv) => total + invoiceBalance(inv), 0);
    const out = [];
    if (overdue.length > 0 && !dismissedReminders.has('overdue')) {
      out.push({
        id: 'overdue',
        variant: 'danger',
        icon: InvoiceAlertIcon,
        title: overdue.length === 1 ? 'Invoice Overdue' : `${overdue.length} Invoices Overdue`,
        description: `${formatInvoiceMoney(sum(overdue))} is past its due date (${overdue.map((inv) => inv.invoiceNumber).join(', ')}). Please arrange payment.`,
        cta: 'View Payments',
        path: '/payments',
      });
    }
    if (dueSoon.length > 0 && !dismissedReminders.has('due')) {
      const dueToday = dueSoon.filter((inv) => new Date(inv.dueDate) < new Date(today.getTime() + 24 * 60 * 60 * 1000));
      out.push({
        id: 'due',
        variant: 'warning',
        icon: WarningIcon,
        title: dueToday.length > 0 ? 'Payment Due Today' : 'Payment Due Soon',
        description: `${formatInvoiceMoney(sum(dueSoon))} is due within the next 3 days (${dueSoon
          .map((inv) => `${inv.invoiceNumber} on ${formatDate(inv.dueDate)}`)
          .join(', ')}).`,
        cta: 'View Payments',
        path: '/payments',
      });
    }
    return out;
  }, [invoices, isClientUser, dismissedReminders]);

  function openCreateModal() {
    setModalMode('create');
    setSelectedInvoice(null);
    const firstClient = clients[0];
    setCreateForm({
      clientId: firstClient?.id ?? '',
      createdDate: todayISO(),
      dueDate: '',
      itemId: catalog[0]?.id ?? '',
      quantity: '1',
      discountPercent: String(firstClient?.discountPercent ?? 0),
      taxRate: String(firstClient?.taxRate ?? 0),
      payNow: false,
      amountPaidNow: '',
      paymentMode: paymentModes[0],
      nextPaymentDate: '',
    });
    setDraftItems([]);
    setCreateErrors({});
    setAddItemError('');
    setIsModalOpen(true);
  }

  function openViewModal(invoice) {
    setSelectedInvoice(invoice);
    setModalMode('view');
    setIsModalOpen(true);
  }

  function openDeleteModal(invoice) {
    setDeleteTarget(invoice);
    setModalMode('delete');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setModalMode(null);
    setSelectedInvoice(null);
    setDeleteTarget(null);
    setCreateErrors({});
    setAddItemError('');
  }

  async function handleCreateInvoice() {
    const validationErrors = validateInvoiceForm(createForm, draftItems);
    if (Object.keys(validationErrors).length > 0) {
      setCreateErrors(validationErrors);
      if (validationErrors.items) {
        setAddItemError(validationErrors.items);
      }
      return;
    }
    setSubmitting(true);
    try {
      const paidNow = createForm.payNow ? round2(createForm.amountPaidNow) : 0;
      const created = await invoicesApi.create({
        client: createForm.clientId,
        createdDate: createForm.createdDate,
        dueDate: createForm.dueDate,
        discountPercent: Number(createForm.discountPercent) || 0,
        taxRate: Number(createForm.taxRate) || 0,
        items: draftItems.map((item) => ({ item: item.itemId, name: item.name, quantity: item.quantity, price: item.price })),
        ...(paidNow > 0 ? { initialPayment: { amount: paidNow, mode: createForm.paymentMode } } : {}),
        ...(createForm.nextPaymentDate && paidNow < draftTotals.total ? { nextPaymentDate: createForm.nextPaymentDate } : {}),
      });
      const { updatedItems, ...invoice } = created;
      setInvoices((current) => [invoice, ...current]);
      // Reflect the reduced stock in the catalog dropdown without a reload.
      if (Array.isArray(updatedItems) && updatedItems.length > 0) {
        setCatalog((current) =>
          current.map((entry) => updatedItems.find((u) => u.id === entry.id) || entry),
        );
      }
      closeModal();
    } catch (err) {
      setCreateErrors({ form: err.message || 'Could not create invoice' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteInvoice() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await invoicesApi.remove(deleteTarget.id);
      setInvoices((current) => current.filter((invoice) => invoice.id !== deleteTarget.id));
      closeModal();
    } catch (err) {
      setCreateErrors({ form: err.message || 'Could not delete invoice' });
    } finally {
      setSubmitting(false);
    }
  }

  async function markPaid(invoice) {
    try {
      const updated = await invoicesApi.setStatus(invoice.id, 'paid');
      setInvoices((current) => current.map((i) => (i.id === invoice.id ? updated : i)));
    } catch {
      // swallow — UI already shows current state
    }
  }

  function handleCreateFieldChange(event) {
    const { name, type, checked } = event.target;
    const value = type === 'checkbox' ? checked : event.target.value;
    setCreateForm((current) => {
      const next = { ...current, [name]: value };
      // Switching client pulls in that client's default discount and tax rate.
      if (name === 'clientId') {
        const client = clients.find((c) => c.id === value);
        next.discountPercent = String(client?.discountPercent ?? 0);
        next.taxRate = String(client?.taxRate ?? 0);
      }
      return next;
    });
    setCreateErrors((current) => {
      if (!current[name] && !(name === 'payNow' && current.amountPaidNow)) return current;
      const next = { ...current };
      delete next[name];
      // Unchecking "pay now" removes the amount field, so its error goes with it.
      if (name === 'payNow' && !value) delete next.amountPaidNow;
      return next;
    });
  }

  function handleAddDraftItem() {
    const item = catalog.find((entry) => entry.id === createForm.itemId);
    if (!item) {
      setAddItemError('Select an item from the catalog.');
      return;
    }
    if (!isPositiveInteger(createForm.quantity)) {
      setAddItemError('Quantity must be a whole number greater than 0.');
      return;
    }
    const quantity = Number(createForm.quantity);
    // Can't invoice more than is in stock (counting what's already on this draft).
    const alreadyDrafted = draftItems
      .filter((line) => line.itemId === item.id)
      .reduce((sum, line) => sum + line.quantity, 0);
    const available = Number(item.stock) || 0;
    if (alreadyDrafted + quantity > available) {
      setAddItemError(
        available - alreadyDrafted > 0
          ? `Only ${available - alreadyDrafted} of ${item.name} available in stock.`
          : `${item.name} is out of stock.`,
      );
      return;
    }
    setDraftItems((current) => [
      ...current,
      {
        id: `${item.id}-${Date.now()}`,
        itemId: item.id,
        name: item.name,
        quantity,
        price: item.price,
      },
    ]);
    setCreateForm((current) => ({ ...current, quantity: '1' }));
    setAddItemError('');
    setCreateErrors((current) => {
      if (!current.items) return current;
      const next = { ...current };
      delete next.items;
      return next;
    });
  }

  function removeDraftItem(id) {
    setDraftItems((current) => current.filter((item) => item.id !== id));
  }

  const invoiceLabel =
    modalMode === 'view' && selectedInvoice
      ? `Invoice ${selectedInvoice.invoiceNumber || selectedInvoice.id}`
      : modalMode === 'delete'
        ? 'Delete Invoice'
        : 'Create New Invoice';

  return (
    <main className="dashboard-shell">
      <DashboardSidebar brand={{ title: 'Jubba group', subtitle: 'ERP System' }} items={sidebarItems} />

      <section className="dashboard-main">
        <DashboardTopbar />

        <div className="dashboard-content invoices-content">
          <nav className="invoices-breadcrumb" aria-label="Breadcrumb">
            <span className="invoices-breadcrumb__home" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2 6.5 8 2l6 4.5V13a1 1 0 0 1-1 1h-2.5v-3.5h-3V14H3a1 1 0 0 1-1-1V6.5Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <img src={invoiceChevronIconSrc} alt="" aria-hidden="true" className="invoices-breadcrumb__chevron" />
            <span className="invoices-breadcrumb__current">Invoices</span>
          </nav>

          <div className="invoices-header">
            <div className="dashboard-heading">
              <h1>Invoices</h1>
              <p>Manage your invoices and billing</p>
            </div>

            {can('invoices', 'create') ? (
            <button type="button" className="invoice-create-button" onClick={openCreateModal}>
              <img src={invoicePlusIconSrc} alt="" aria-hidden="true" className="invoice-create-button__icon" />
              Create Invoice
            </button>
            ) : null}
          </div>

          {reminders.length > 0 ? (
            <div className="dashboard-alerts">
              {reminders.map((reminder) => (
                <AlertBanner
                  key={reminder.id}
                  variant={reminder.variant}
                  icon={reminder.icon}
                  title={reminder.title}
                  description={reminder.description}
                  cta={reminder.cta}
                  onClick={() => navigate(reminder.path)}
                  onDismiss={() => setDismissedReminders((prev) => new Set(prev).add(reminder.id))}
                />
              ))}
            </div>
          ) : null}

          <section className="invoice-stats">
            {stats.map((stat) => (
              <article key={stat.label} className="invoice-stat-card">
                <div className={`invoice-stat-card__icon invoice-stat-card__icon--${stat.tone}`}>
                  <img src={stat.iconSrc} alt="" aria-hidden="true" />
                </div>
                <div className="invoice-stat-card__text">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              </article>
            ))}
          </section>

          <section className="invoice-list-card">
            <label className="invoice-search">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Invoice ID"
                aria-label="Search invoices"
              />
              <img
                src={invoiceSearchIconSrc}
                alt=""
                aria-hidden="true"
                className="invoice-search__icon"
              />
            </label>

            {loadError ? <p className="auth-error">{loadError}</p> : null}

            <div className="table-wrap">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Client</th>
                    <th>Created</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && invoices.length === 0 ? (
                    <tr><td colSpan="7">Loading…</td></tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr><td colSpan="7">No invoices yet.</td></tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="invoice-id">{invoice.invoiceNumber || invoice.id}</td>
                        <td>{invoice.clientName}</td>
                        <td>{formatDate(invoice.createdDate)}</td>
                        <td>{formatDate(invoice.dueDate)}</td>
                        <td className="invoice-amount">{formatInvoiceMoney(invoice.amount)}</td>
                        <td>
                          <span className={`invoice-pill invoice-pill--${invoice.status}`}>{STATUS_LABEL[invoice.status] || invoice.status}</span>
                          {invoice.status === 'partial' ? (
                            <span className="invoice-balance-note">
                              {formatInvoiceMoney(invoiceBalance(invoice))} due
                              {invoice.nextPaymentDate ? ` · next: ${formatDate(invoice.nextPaymentDate)}` : ''}
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <div className="invoice-actions">
                            {invoice.status !== 'paid' ? (
                              can('invoices', 'edit') ? (
                                <button type="button" className="invoice-view-button" onClick={() => markPaid(invoice)}>
                                  Mark Paid
                                </button>
                              ) : null
                            ) : (
                              <button
                                type="button"
                                className="invoice-icon-action"
                                aria-label={`Download ${invoice.invoiceNumber || invoice.id}`}
                                onClick={() => downloadInvoice(invoice, clients.find((c) => c.id === invoice.client))}
                              >
                                <img src={invoiceDownloadIconSrc} alt="" aria-hidden="true" />
                              </button>
                            )}
                            <button type="button" className="invoice-view-button" onClick={() => openViewModal(invoice)}>
                              View
                            </button>
                            {can('invoices', 'delete') ? (
                              <button type="button" className="invoice-delete-button" onClick={() => openDeleteModal(invoice)}>
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      {isModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <section
            className={`invoice-modal${modalMode === 'view' ? ' invoice-modal--detail' : ''}${modalMode === 'delete' ? ' invoice-modal--delete' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="invoice-modal__header">
              <h2 id="invoice-modal-title">{invoiceLabel}</h2>
              <button type="button" className="modal-close" aria-label="Close modal" onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>

            {modalMode === 'create' ? (
              <div className="invoice-create">
                <div className="invoice-create__grid">
                  <label className="invoice-field">
                    <span>Select Client</span>
                    <div className="invoice-select">
                      <select
                        value={createForm.clientId}
                        name="clientId"
                        onChange={handleCreateFieldChange}
                        aria-invalid={Boolean(createErrors.clientId)}
                        className={createErrors.clientId ? 'field-input--invalid' : ''}
                      >
                        <option value="" disabled></option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                      <img
                        src={invoiceModalChevronIconSrc}
                        alt=""
                        aria-hidden="true"
                        className="invoice-select__chevron"
                      />
                    </div>
                    {createErrors.clientId ? (
                      <span className="field-error">{createErrors.clientId}</span>
                    ) : null}
                  </label>

                  <label className="invoice-field">
                    <span>Created Date</span>
                    <input
                      type="date"
                      name="createdDate"
                      value={createForm.createdDate}
                      onChange={handleCreateFieldChange}
                      placeholder="YYYY-MM-DD"
                      aria-invalid={Boolean(createErrors.createdDate)}
                      className={createErrors.createdDate ? 'field-input--invalid' : ''}
                    />
                    {createErrors.createdDate ? (
                      <span className="field-error">{createErrors.createdDate}</span>
                    ) : null}
                  </label>

                  <label className="invoice-field">
                    <span>Due Date</span>
                    <input
                      type="date"
                      name="dueDate"
                      value={createForm.dueDate}
                      onChange={handleCreateFieldChange}
                      placeholder="YYYY-MM-DD"
                      aria-invalid={Boolean(createErrors.dueDate)}
                      className={createErrors.dueDate ? 'field-input--invalid' : ''}
                    />
                    {createErrors.dueDate ? (
                      <span className="field-error">{createErrors.dueDate}</span>
                    ) : null}
                  </label>
                </div>

                <div className="invoice-create__section-title">Add Items</div>

                <div className="invoice-add-row">
                  <label className="invoice-field invoice-field--grow">
                    <div className="invoice-select">
                      <select value={createForm.itemId} name="itemId" onChange={handleCreateFieldChange}>
                        <option value="" disabled></option>
                        {catalog.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} _$ {item.price}(Stock:{item.stock})
                          </option>
                        ))}
                      </select>
                      <img
                        src={invoiceModalChevronIconSrc}
                        alt=""
                        aria-hidden="true"
                        className="invoice-select__chevron"
                      />
                    </div>
                  </label>

                  <label className="invoice-field invoice-field--quantity">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      name="quantity"
                      value={createForm.quantity}
                      onChange={handleCreateFieldChange}
                      aria-invalid={Boolean(addItemError)}
                      className={addItemError ? 'field-input--invalid' : ''}
                    />
                  </label>

                  <button type="button" className="invoice-add-item-button" onClick={handleAddDraftItem} aria-label="Add item">
                    <img src={invoiceAddItemIconSrc} alt="" aria-hidden="true" />
                  </button>
                </div>
                {addItemError ? <span className="field-error">{addItemError}</span> : null}

                {draftItems.length ? (
                  <div className="invoice-lines">
                    <table className="invoice-lines__table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draftItems.map((item) => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>{formatInvoiceMoney(item.price)}</td>
                            <td>{formatInvoiceMoney(item.price * item.quantity)}</td>
                            <td>
                              <button
                                type="button"
                                className="invoice-line-delete"
                                onClick={() => removeDraftItem(item.id)}
                                aria-label={`Remove ${item.name}`}
                              >
                                <TrashIcon />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="invoice-pricing">
                      <label className="invoice-field">
                        <span>Discount (%)</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          name="discountPercent"
                          value={createForm.discountPercent}
                          onChange={handleCreateFieldChange}
                          aria-invalid={Boolean(createErrors.discountPercent)}
                          className={createErrors.discountPercent ? 'field-input--invalid' : ''}
                        />
                        {createErrors.discountPercent ? <span className="field-error">{createErrors.discountPercent}</span> : null}
                      </label>
                      <label className="invoice-field">
                        <span>Tax (%)</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          name="taxRate"
                          value={createForm.taxRate}
                          onChange={handleCreateFieldChange}
                          aria-invalid={Boolean(createErrors.taxRate)}
                          className={createErrors.taxRate ? 'field-input--invalid' : ''}
                        />
                        {createErrors.taxRate ? <span className="field-error">{createErrors.taxRate}</span> : null}
                      </label>
                    </div>

                    <div className="invoice-totals">
                      <div className="invoice-totals__row">
                        <span>Subtotal</span>
                        <span>{formatInvoiceMoney(draftTotals.subtotal)}</span>
                      </div>
                      {draftTotals.discountAmount > 0 ? (
                        <div className="invoice-totals__row">
                          <span>Discount ({Number(createForm.discountPercent) || 0}%)</span>
                          <span>-{formatInvoiceMoney(draftTotals.discountAmount)}</span>
                        </div>
                      ) : null}
                      {draftTotals.taxAmount > 0 ? (
                        <div className="invoice-totals__row">
                          <span>Tax ({Number(createForm.taxRate) || 0}% on {formatInvoiceMoney(draftTotals.taxable)})</span>
                          <span>{formatInvoiceMoney(draftTotals.taxAmount)}</span>
                        </div>
                      ) : null}
                      <div className="invoice-totals__total">
                        <span>Total:</span>
                        <strong>{formatInvoiceMoney(draftTotals.total)}</strong>
                      </div>
                      {createForm.payNow && Number(createForm.amountPaidNow) > 0 ? (
                        <>
                          <div className="invoice-totals__row">
                            <span>Paying Now</span>
                            <span>-{formatInvoiceMoney(Number(createForm.amountPaidNow))}</span>
                          </div>
                          <div className="invoice-totals__total">
                            <span>Balance Due:</span>
                            <strong>{formatInvoiceMoney(Math.max(0, round2(draftTotals.total - Number(createForm.amountPaidNow))))}</strong>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="invoice-empty-add">
                    <img src={invoiceEmptyPlusIconSrc} alt="" aria-hidden="true" />
                    <p>Add items to this invoice</p>
                  </div>
                )}

                <div className="invoice-create__section-title invoice-payment-title">Payment</div>

                <label className="invoice-paynow-check">
                  <input
                    type="checkbox"
                    name="payNow"
                    checked={createForm.payNow}
                    onChange={handleCreateFieldChange}
                  />
                  <span>Client is paying an amount now</span>
                </label>

                {createForm.payNow ? (
                  <div className="invoice-pricing">
                    <label className="invoice-field">
                      <span>Amount Received ($)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="amountPaidNow"
                        value={createForm.amountPaidNow}
                        onChange={handleCreateFieldChange}
                        placeholder="0.00"
                        aria-invalid={Boolean(createErrors.amountPaidNow)}
                        className={createErrors.amountPaidNow ? 'field-input--invalid' : ''}
                      />
                      {createErrors.amountPaidNow ? <span className="field-error">{createErrors.amountPaidNow}</span> : null}
                    </label>
                    <label className="invoice-field">
                      <span>Payment Mode</span>
                      <div className="invoice-select">
                        <select name="paymentMode" value={createForm.paymentMode} onChange={handleCreateFieldChange}>
                          {paymentModes.map((mode) => (
                            <option key={mode} value={mode}>
                              {mode}
                            </option>
                          ))}
                        </select>
                        <img
                          src={invoiceModalChevronIconSrc}
                          alt=""
                          aria-hidden="true"
                          className="invoice-select__chevron"
                        />
                      </div>
                    </label>
                  </div>
                ) : null}

                {!createForm.payNow || round2(createForm.amountPaidNow) < draftTotals.total ? (
                  <div className="invoice-pricing">
                    <label className="invoice-field">
                      <span>Next Payment Date{createForm.payNow ? ' (for the balance)' : ''}</span>
                      <input
                        type="date"
                        name="nextPaymentDate"
                        value={createForm.nextPaymentDate}
                        onChange={handleCreateFieldChange}
                        placeholder="YYYY-MM-DD"
                        aria-invalid={Boolean(createErrors.nextPaymentDate)}
                        className={createErrors.nextPaymentDate ? 'field-input--invalid' : ''}
                      />
                      {createErrors.nextPaymentDate ? (
                        <span className="field-error">{createErrors.nextPaymentDate}</span>
                      ) : (
                        <span className="invoice-field__hint">Optional — when the client will pay{createForm.payNow ? ' the rest' : ''}.</span>
                      )}
                    </label>
                  </div>
                ) : null}

                {createErrors.form ? <span className="field-error">{createErrors.form}</span> : null}

                <div className="invoice-modal__footer">
                  <button type="button" className="modal-text-button" onClick={closeModal} disabled={submitting}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="modal-primary-button invoice-modal__primary"
                    disabled={!draftItems.length || submitting}
                    onClick={handleCreateInvoice}
                  >
                    {submitting ? 'Saving…' : 'Create Invoice'}
                  </button>
                </div>
              </div>
            ) : null}

            {modalMode === 'view' && selectedInvoice ? (
              <div className="invoice-detail">
                <div className="invoice-detail__meta">
                  <div className="invoice-detail__field">
                    <span>Client</span>
                    <div className="invoice-detail__value">
                      <img src={invoiceDetailUserIconSrc} alt="" aria-hidden="true" />
                      {selectedInvoice.clientName}
                    </div>
                  </div>
                  <div className="invoice-detail__field">
                    <span>Status</span>
                    <div className="invoice-detail__value">
                      <span className={`invoice-pill invoice-pill--${selectedInvoice.status}`}>
                        {STATUS_LABEL[selectedInvoice.status] || selectedInvoice.status}
                      </span>
                    </div>
                  </div>
                  <div className="invoice-detail__field">
                    <span>Created Date</span>
                    <div className="invoice-detail__value">
                      <img src={invoiceDetailCalendarIconSrc} alt="" aria-hidden="true" />
                      {formatDate(selectedInvoice.createdDate)}
                    </div>
                  </div>
                  <div className="invoice-detail__field">
                    <span>Due Date</span>
                    <div className="invoice-detail__value">
                      <img src={invoiceDetailCalendarIconSrc} alt="" aria-hidden="true" />
                      {formatDate(selectedInvoice.dueDate)}
                    </div>
                  </div>
                  {selectedInvoice.nextPaymentDate ? (
                    <div className="invoice-detail__field">
                      <span>Next Payment Date</span>
                      <div className="invoice-detail__value">
                        <img src={invoiceDetailCalendarIconSrc} alt="" aria-hidden="true" />
                        {formatDate(selectedInvoice.nextPaymentDate)}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="invoice-detail__items-section">
                  <h3 className="invoice-detail__items-title">Items</h3>
                  <div className="invoice-detail__items">
                    {(selectedInvoice.items || []).map((item, idx) => (
                      <div key={`${selectedInvoice.id}-${item.name}-${idx}`} className="invoice-detail__item">
                        <div className="invoice-detail__item-info">
                          <strong>{item.name}</strong>
                          <span>
                            {item.quantity} x {formatInvoiceMoney(item.price)}
                          </span>
                        </div>
                        <strong>{formatInvoiceMoney(item.quantity * item.price)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="invoice-detail__totals">
                  {(Number(selectedInvoice.discountAmount) > 0 || Number(selectedInvoice.taxAmount) > 0) ? (
                    <div className="invoice-totals__row">
                      <span>Subtotal</span>
                      <span>{formatInvoiceMoney(selectedInvoice.subtotal ?? selectedInvoice.amount)}</span>
                    </div>
                  ) : null}
                  {Number(selectedInvoice.discountAmount) > 0 ? (
                    <div className="invoice-totals__row">
                      <span>Discount ({selectedInvoice.discountPercent}%)</span>
                      <span>-{formatInvoiceMoney(selectedInvoice.discountAmount)}</span>
                    </div>
                  ) : null}
                  {Number(selectedInvoice.taxAmount) > 0 ? (
                    <div className="invoice-totals__row">
                      <span>Tax ({selectedInvoice.taxRate}%)</span>
                      <span>{formatInvoiceMoney(selectedInvoice.taxAmount)}</span>
                    </div>
                  ) : null}
                  <div className="invoice-detail__total">
                    <span>Total:</span>
                    <strong>{formatInvoiceMoney(selectedInvoice.amount)}</strong>
                  </div>
                  {Number(selectedInvoice.amountPaid) > 0 ? (
                    <>
                      <div className="invoice-totals__row">
                        <span>Paid</span>
                        <span>{formatInvoiceMoney(selectedInvoice.amountPaid)}</span>
                      </div>
                      <div className="invoice-detail__total invoice-detail__total--balance">
                        <span>Balance Due:</span>
                        <strong>{formatInvoiceMoney(invoiceBalance(selectedInvoice))}</strong>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}

            {modalMode === 'delete' && deleteTarget ? (
              <div className="invoice-delete-dialog">
                <div className="invoice-delete-dialog__body">
                  <div className="invoice-delete-dialog__icon">
                    <img src={invoiceDeleteTrashIconSrc} alt="" aria-hidden="true" />
                  </div>
                  <p className="invoice-delete-dialog__text">
                    Are you sure you want to delete invoice {deleteTarget.invoiceNumber || deleteTarget.id}? This action cannot be undone.
                  </p>
                </div>
                <div className="invoice-modal__footer">
                  <button type="button" className="modal-text-button" onClick={closeModal} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="button" className="invoice-delete-confirm" onClick={handleDeleteInvoice} disabled={submitting}>
                    {submitting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </main>
  );
}

function formatInvoiceMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(value || 0);
}
