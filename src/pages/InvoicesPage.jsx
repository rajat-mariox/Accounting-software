import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import AlertBanner from '../components/dashboard/AlertBanner';
import { CloseIcon, TrashIcon, WarningIcon, InvoiceAlertIcon } from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { paymentModes } from '../data/payments';
import { invoicesApi, clientsApi, inventoryApi, paymentsApi } from '../api';
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
import { baseCurrency, currencyRate, findCurrency, formatDisplayDate, formatMoney, getCurrencySettings, toBase } from '../utils/currency';
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

// Whole days past the promised date (next payment date if set, else the due date).
function overdueDays(invoice) {
  const promised = invoice.nextPaymentDate || invoice.dueDate;
  if (!promised) return 0;
  const due = new Date(promised);
  if (Number.isNaN(due.getTime())) return 0;
  const today = new Date();
  const startToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.floor((startToday - due.getTime()) / 86400000));
}

const STATUS_LABEL = {
  paid: 'paid',
  partial: 'partially paid',
  pending: 'pending',
  overdue: 'overdue',
  cancelled: 'cancelled',
};

function formatDate(value) {
  return formatDisplayDate(value);
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

// "ONE HUNDRED US DOLLARS AND FIVE CENTS ONLY" — words use the invoice currency's name.
function amountInWords(amount, currencyCode) {
  const total = Math.round((Number(amount) || 0) * 100);
  const major = Math.floor(total / 100);
  const minor = total % 100;
  const name = String(findCurrency(currencyCode).name || currencyCode || 'US Dollar').toUpperCase();
  const plural = name.endsWith('S') ? name : `${name}S`;
  const majorWords = `${numberToWords(major)} ${major === 1 ? name : plural}`;
  if (!minor) return `${majorWords} ONLY`;
  return `${majorWords} AND ${numberToWords(minor)} ${minor === 1 ? 'CENT' : 'CENTS'} ONLY`;
}

function formatDocDate(value) {
  return formatDisplayDate(value);
}

// `payment` (optional) makes this the invoice page for one payment:
// { index, count, amount, date, mode, reference, paidBefore, balanceAfter }.
function buildInvoiceHtml(invoice, client, payment) {
  const number = invoice.invoiceNumber || invoice.id;
  const code = invoice.currency || baseCurrency();
  const formatDocMoney = (value) => formatMoney(value, code);
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
        <td class="r">${item.price * item.quantity ? formatDocMoney(item.price * item.quantity) : '-'}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Invoice ${escapeHtml(number)}</title>
</head>
<body style="margin:0;background:#fff">
<div class="jgc-invoice">
<style>
  /* Scoped to .jgc-invoice: the PDF library copies this element into the app page
     before rendering, so styles must travel with it and must not touch the app. */
  .jgc-invoice { width: 794px; margin: 0; background: #fff; color: #111;
    font-family: 'Cambria', 'Georgia', 'Times New Roman', serif; font-size: 14px; line-height: 1.35;
    -webkit-font-smoothing: antialiased; }
  .jgc-invoice * { box-sizing: border-box; font-family: inherit; }
  .jgc-invoice .page { width: 794px; min-height: 1120px; display: flex; flex-direction: column; }
  .jgc-invoice .banner { display: block; width: 100%; height: auto; }
  .jgc-invoice .banner--header { margin-bottom: 22px; }
  .jgc-invoice .content { padding: 0 36px; }
  .jgc-invoice table.doc { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .jgc-invoice table.doc td,
  .jgc-invoice table.doc th { border: 1px solid #111; padding: 6px 10px; font-size: 13.5px;
    vertical-align: middle; overflow-wrap: anywhere; }
  .jgc-invoice .label { font-weight: 700; }
  .jgc-invoice .u { text-decoration: underline; }
  .jgc-invoice .red { color: #e02020; }
  .jgc-invoice .title-cell { text-align: center; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
  .jgc-invoice .c { text-align: center; }
  .jgc-invoice .r { text-align: right; white-space: nowrap; }
  .jgc-invoice table.items th { background: #eee; text-align: center; font-size: 12.5px; font-weight: 700; line-height: 1.2; }
  .jgc-invoice table.items th.desc { font-style: italic; color: #4472c4; font-weight: 600; font-size: 15px; }
  .jgc-invoice table.doc td.blank { border-top: none; border-bottom: none; }
  .jgc-invoice table.items th:first-child { white-space: nowrap; }
  .jgc-invoice .sum-label { text-align: right; font-weight: 600; white-space: nowrap; }
  .jgc-invoice .total-row td { font-size: 15.5px; font-weight: 700; }
  .jgc-invoice .words-row td { padding: 12px; text-align: center; font-weight: 700; }
  .jgc-invoice .footer { margin-top: auto; padding-top: 24px; }
</style>
<div class="page">
  <img class="banner banner--header" src="${jgcHeaderSrc}" alt="Jubba Group of Companies" />

  <div class="content">
  <table class="doc">
    <colgroup><col style="width:52%" /><col style="width:22%" /><col style="width:26%" /></colgroup>
    <tr>
      <td class="label u">ISSUER</td>
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
      <td class="label">INVOICE NO.</td>
      <td class="c">${escapeHtml(number)}</td>
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
      <td colspan="2" class="c" style="text-transform:uppercase">${escapeHtml(
        payment ? (payment.balanceAfter > 0.005 ? 'Partially paid' : 'Paid') : invoice.status || ''
      )}</td>
    </tr>
    ${payment ? `
    <tr>
      <td class="label">PAYMENT ${escapeHtml(`${payment.index} OF ${payment.count}`)}</td>
      <td colspan="2" class="c" style="text-transform:uppercase">${escapeHtml(
        [
          formatDocDate(payment.date),
          payment.mode,
          payment.reference,
          payment.received ? `paid as ${formatMoney(payment.received.amount, payment.received.currency)}` : '',
        ].filter(Boolean).join(' / ')
      )}</td>
    </tr>` : ''}
    ${invoice.notes ? `<tr><td class="label">NOTES</td><td colspan="2">${escapeHtml(invoice.notes)}</td></tr>` : ''}
  </table>

  <table class="doc items" style="margin-top:-1px">
    <colgroup>
      <col style="width:9%" /><col style="width:35%" /><col style="width:14%" />
      <col style="width:10%" /><col style="width:12%" /><col style="width:20%" />
    </colgroup>
    <thead>
      <tr>
        <th>ITEM</th>
        <th class="desc">Description</th>
        <th>UNIT<br/>PRICE</th>
        <th>UNIT</th>
        <th>QTY</th>
        <th>AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="6" class="c">No items</td></tr>'}
      ${Number(invoice.discountAmount) > 0 || Number(invoice.taxAmount) > 0 ? `
      <tr>
        <td colspan="2" class="blank"></td>
        <td colspan="2" class="sum-label">SUBTOTAL</td>
        <td class="c">${escapeHtml(code)}</td>
        <td class="r">${formatDocMoney(invoice.subtotal ?? invoice.amount)}</td>
      </tr>` : ''}
      ${Number(invoice.discountAmount) > 0 ? `
      <tr>
        <td colspan="2" class="blank"></td>
        <td colspan="2" class="sum-label">DISCOUNT ${escapeHtml(String(invoice.discountPercent || 0))}%</td>
        <td class="c">${escapeHtml(code)}</td>
        <td class="r">-${formatDocMoney(invoice.discountAmount)}</td>
      </tr>` : ''}
      ${Number(invoice.taxAmount) > 0 ? `
      <tr>
        <td colspan="2" class="blank"></td>
        <td colspan="2" class="sum-label">TAX ${escapeHtml(String(invoice.taxRate || 0))}%</td>
        <td class="c">${escapeHtml(code)}</td>
        <td class="r">${formatDocMoney(invoice.taxAmount)}</td>
      </tr>` : ''}
      <tr class="total-row">
        <td colspan="2" class="blank"></td>
        <td colspan="2" class="sum-label red">TOTAL</td>
        <td class="c red">${escapeHtml(code)}</td>
        <td class="r red">${formatDocMoney(invoice.amount)}</td>
      </tr>
      ${payment ? `
      ${payment.paidBefore > 0.005 ? `
      <tr>
        <td colspan="2" class="blank"></td>
        <td colspan="2" class="sum-label">PAID BEFORE</td>
        <td class="c">${escapeHtml(code)}</td>
        <td class="r">${formatDocMoney(payment.paidBefore)}</td>
      </tr>` : ''}
      <tr class="total-row">
        <td colspan="2" class="blank"></td>
        <td colspan="2" class="sum-label">THIS PAYMENT</td>
        <td class="c">${escapeHtml(code)}</td>
        <td class="r">${formatDocMoney(payment.amount)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="2" class="blank"></td>
        <td colspan="2" class="sum-label red">BALANCE DUE</td>
        <td class="c red">${escapeHtml(code)}</td>
        <td class="r red">${formatDocMoney(payment.balanceAfter)}</td>
      </tr>` : Number(invoice.amountPaid) > 0 && Number(invoice.amountPaid) < Number(invoice.amount) ? `
      <tr>
        <td colspan="2" class="blank"></td>
        <td colspan="2" class="sum-label">PAID</td>
        <td class="c">${escapeHtml(code)}</td>
        <td class="r">${formatDocMoney(invoice.amountPaid)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="2" class="blank"></td>
        <td colspan="2" class="sum-label red">BALANCE DUE</td>
        <td class="c red">${escapeHtml(code)}</td>
        <td class="r red">${formatDocMoney(Number(invoice.amount) - Number(invoice.amountPaid))}</td>
      </tr>
      ${invoice.nextPaymentDate ? `
      <tr>
        <td colspan="2" class="blank"></td>
        <td colspan="2" class="sum-label">NEXT PAYMENT</td>
        <td colspan="2" class="r">${escapeHtml(formatDocDate(invoice.nextPaymentDate))}</td>
      </tr>` : ''}` : ''}
      <tr class="words-row">
        <td colspan="2" class="red">AMOUNT IN<br/>WORDS</td>
        <td colspan="4" class="red">${escapeHtml(amountInWords(invoice.amount, code))}</td>
      </tr>
    </tbody>
  </table>
  </div>

  <div class="footer">
    <img class="banner" src="${jgcFooterSrc}" alt="Contact: 0619998770 / 0616111139, Info@jubbagroup.so, Mogadishu Somalia" />
  </div>
</div>
</div>
</body>
</html>`;
}

// One page per payment, oldest first, each showing that payment and the balance
// left after it. An invoice with no payments yet gets the normal single page.
function paymentPages(invoice, payments) {
  const total = Number(invoice.amount || 0);
  const sorted = [...payments].sort(
    (a, b) => new Date(a.date) - new Date(b.date) || String(a.id).localeCompare(String(b.id))
  );
  let paid = 0;
  return sorted.map((payment, index) => {
    const paidBefore = paid;
    paid = round2(paid + Number(payment.amount || 0));
    return {
      index: index + 1,
      count: sorted.length,
      amount: payment.amount,
      date: payment.date,
      mode: payment.mode,
      reference: payment.reference,
      received: payment.received?.amount ? payment.received : null,
      paidBefore,
      balanceAfter: Math.max(0, round2(total - paid)),
    };
  });
}

// Writes the page HTML into a hidden iframe (so its styles cannot clash with the
// app) and resolves with that iframe once its images have loaded.
function renderInIframe(html) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '794px';
  iframe.style.height = '1160px';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  doc.open();
  doc.write(html);
  doc.close();
  return new Promise((resolve) => {
    if (doc.readyState === 'complete') {
      setTimeout(() => resolve(iframe), 150);
    } else {
      iframe.onload = () => setTimeout(() => resolve(iframe), 150);
    }
  });
}

async function downloadInvoice(invoice, client, payments = []) {
  const pages = payments.length
    ? paymentPages(invoice, payments).map((payment) => buildInvoiceHtml(invoice, client, payment))
    : [buildInvoiceHtml(invoice, client)];
  const iframes = [];
  try {
    for (const html of pages) iframes.push(await renderInIframe(html));
    // Each payment page is rendered on its own, then appended to the same PDF.
    let worker = html2pdf()
      .set({
        margin: 0,
        filename: `${invoice.invoiceNumber || invoice.id}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 794, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(iframes[0].contentDocument.querySelector('.jgc-invoice'))
      .toPdf();
    for (const iframe of iframes.slice(1)) {
      worker = worker
        .get('pdf')
        .then((pdf) => pdf.addPage())
        .from(iframe.contentDocument.querySelector('.jgc-invoice'))
        .toContainer()
        .toCanvas()
        .toPdf();
    }
    await worker.save();
  } finally {
    for (const iframe of iframes) document.body.removeChild(iframe);
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
      errors.amountPaidNow = `Amount cannot exceed the invoice total of ${formatInvoiceMoney(total, form.currency)}.`;
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
  const [createForm, setCreateForm] = useState({ clientId: '', createdDate: todayISO(), dueDate: '', itemId: '', quantity: '1', discountPercent: '0', taxRate: '0', currency: baseCurrency(), exchangeRate: '1', payNow: false, amountPaidNow: '', paymentMode: paymentModes[0], nextPaymentDate: '' });
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

  // Inventory prices are in the base currency; convert them at the invoice's rate.
  const draftRate = Number(createForm.exchangeRate) > 0 ? Number(createForm.exchangeRate) : 1;
  const pricedItems = useMemo(
    () => draftItems.map((line) => ({ ...line, price: round2(line.basePrice * draftRate) })),
    [draftItems, draftRate],
  );
  const draftTotals = useMemo(
    () => computeTotals(pricedItems, createForm.discountPercent, createForm.taxRate),
    [pricedItems, createForm.discountPercent, createForm.taxRate],
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
    // Invoices can be in different currencies, so totals are shown in the base currency.
    const sum = (rows) => rows.reduce((total, inv) => total + toBase(invoiceBalance(inv), inv.exchangeRate), 0);
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
      currency: firstClient?.currency || baseCurrency(),
      exchangeRate: String(currencyRate(firstClient?.currency || baseCurrency())),
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
    const validationErrors = validateInvoiceForm(createForm, pricedItems);
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
        currency: createForm.currency,
        exchangeRate: draftRate,
        items: pricedItems.map((item) => ({ item: item.itemId, name: item.name, quantity: item.quantity, price: item.price })),
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

  // Download pulls this invoice's payments so the PDF has one page per payment.
  async function handleDownload(invoice) {
    let invoicePayments = [];
    try {
      const all = await paymentsApi.list();
      invoicePayments = all.filter(
        (p) => (typeof p.invoice === 'object' ? p.invoice?.id : p.invoice) === invoice.id
      );
    } catch {
      // Without the payment list, fall back to the single-page invoice.
    }
    await downloadInvoice(invoice, clients.find((c) => c.id === invoice.client), invoicePayments);
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
        // ...and their billing currency (rate = units of it per 1 base currency).
        next.currency = client?.currency || baseCurrency();
        next.exchangeRate = String(currencyRate(next.currency));
      }
      if (name === 'currency') {
        next.exchangeRate = String(currencyRate(value));
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
        basePrice: item.price,
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
                        <td className="invoice-amount">{formatInvoiceMoney(invoice.amount, invoice.currency)}</td>
                        <td>
                          <span className={`invoice-pill invoice-pill--${invoice.status}`}>{STATUS_LABEL[invoice.status] || invoice.status}</span>
                          {invoice.status === 'partial' ? (
                            <span className="invoice-balance-note">
                              {formatInvoiceMoney(invoiceBalance(invoice), invoice.currency)} due
                              {invoice.nextPaymentDate ? ` · next: ${formatDate(invoice.nextPaymentDate)}` : ''}
                            </span>
                          ) : invoice.status === 'overdue' && invoiceBalance(invoice) > 0 ? (
                            <span className="invoice-balance-note invoice-balance-note--overdue">
                              {formatInvoiceMoney(invoiceBalance(invoice), invoice.currency)} overdue
                              {overdueDays(invoice) > 0
                                ? ` · ${overdueDays(invoice)} day${overdueDays(invoice) === 1 ? '' : 's'} late`
                                : ''}
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <div className="invoice-actions">
                            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && can('invoices', 'edit') ? (
                              <button type="button" className="invoice-view-button" onClick={() => markPaid(invoice)}>
                                Mark Paid
                              </button>
                            ) : null}
                            {/* Download is available at any payment stage; a part-paid invoice's
                                PDF shows the amount paid and the balance still due. */}
                            {invoice.status !== 'cancelled' ? (
                              <button
                                type="button"
                                className="invoice-icon-action"
                                aria-label={`Download ${invoice.invoiceNumber || invoice.id}`}
                                title="Download invoice"
                                onClick={() => handleDownload(invoice)}
                              >
                                <img src={invoiceDownloadIconSrc} alt="" aria-hidden="true" />
                              </button>
                            ) : null}
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
                            {item.name} · {formatMoney(item.price)} (Stock: {item.stock})
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
                        {pricedItems.map((item) => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>{formatInvoiceMoney(item.price, createForm.currency)}</td>
                            <td>{formatInvoiceMoney(item.price * item.quantity, createForm.currency)}</td>
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
                      <label className="invoice-field">
                        <span>Currency</span>
                        <div className="invoice-select">
                          <select name="currency" value={createForm.currency} onChange={handleCreateFieldChange}>
                            {getCurrencySettings().currencies.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code} · {c.name}
                              </option>
                            ))}
                          </select>
                          <img src={invoiceModalChevronIconSrc} alt="" aria-hidden="true" className="invoice-select__chevron" />
                        </div>
                      </label>
                      {createForm.currency !== baseCurrency() ? (
                        <label className="invoice-field">
                          <span>Rate (1 {baseCurrency()} = ? {createForm.currency})</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            name="exchangeRate"
                            value={createForm.exchangeRate}
                            onChange={handleCreateFieldChange}
                          />
                        </label>
                      ) : null}
                    </div>
                    {createForm.currency !== baseCurrency() ? (
                      <p className="invoice-currency-note">
                        Item prices are converted from {baseCurrency()} at this rate. The rate is saved on the invoice and will not change later.
                      </p>
                    ) : null}

                    <div className="invoice-totals">
                      <div className="invoice-totals__row">
                        <span>Subtotal</span>
                        <span>{formatInvoiceMoney(draftTotals.subtotal, createForm.currency)}</span>
                      </div>
                      {draftTotals.discountAmount > 0 ? (
                        <div className="invoice-totals__row">
                          <span>Discount ({Number(createForm.discountPercent) || 0}%)</span>
                          <span>-{formatInvoiceMoney(draftTotals.discountAmount, createForm.currency)}</span>
                        </div>
                      ) : null}
                      {draftTotals.taxAmount > 0 ? (
                        <div className="invoice-totals__row">
                          <span>Tax ({Number(createForm.taxRate) || 0}% on {formatInvoiceMoney(draftTotals.taxable, createForm.currency)})</span>
                          <span>{formatInvoiceMoney(draftTotals.taxAmount, createForm.currency)}</span>
                        </div>
                      ) : null}
                      <div className="invoice-totals__total">
                        <span>Total:</span>
                        <strong>{formatInvoiceMoney(draftTotals.total, createForm.currency)}</strong>
                      </div>
                      {createForm.payNow && Number(createForm.amountPaidNow) > 0 ? (
                        <>
                          <div className="invoice-totals__row">
                            <span>Paying Now</span>
                            <span>-{formatInvoiceMoney(Number(createForm.amountPaidNow), createForm.currency)}</span>
                          </div>
                          <div className="invoice-totals__total">
                            <span>Balance Due:</span>
                            <strong>{formatInvoiceMoney(Math.max(0, round2(draftTotals.total - Number(createForm.amountPaidNow))), createForm.currency)}</strong>
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
                      <span>Amount Received ({createForm.currency})</span>
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
                            {item.quantity} x {formatInvoiceMoney(item.price, selectedInvoice.currency)}
                          </span>
                        </div>
                        <strong>{formatInvoiceMoney(item.quantity * item.price, selectedInvoice.currency)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="invoice-detail__totals">
                  {(Number(selectedInvoice.discountAmount) > 0 || Number(selectedInvoice.taxAmount) > 0) ? (
                    <div className="invoice-totals__row">
                      <span>Subtotal</span>
                      <span>{formatInvoiceMoney(selectedInvoice.subtotal ?? selectedInvoice.amount, selectedInvoice.currency)}</span>
                    </div>
                  ) : null}
                  {Number(selectedInvoice.discountAmount) > 0 ? (
                    <div className="invoice-totals__row">
                      <span>Discount ({selectedInvoice.discountPercent}%)</span>
                      <span>-{formatInvoiceMoney(selectedInvoice.discountAmount, selectedInvoice.currency)}</span>
                    </div>
                  ) : null}
                  {Number(selectedInvoice.taxAmount) > 0 ? (
                    <div className="invoice-totals__row">
                      <span>Tax ({selectedInvoice.taxRate}%)</span>
                      <span>{formatInvoiceMoney(selectedInvoice.taxAmount, selectedInvoice.currency)}</span>
                    </div>
                  ) : null}
                  <div className="invoice-detail__total">
                    <span>Total:</span>
                    <strong>{formatInvoiceMoney(selectedInvoice.amount, selectedInvoice.currency)}</strong>
                  </div>
                  {Number(selectedInvoice.amountPaid) > 0 ? (
                    <>
                      <div className="invoice-totals__row">
                        <span>Paid</span>
                        <span>{formatInvoiceMoney(selectedInvoice.amountPaid, selectedInvoice.currency)}</span>
                      </div>
                      <div className="invoice-detail__total invoice-detail__total--balance">
                        <span>Balance Due:</span>
                        <strong>{formatInvoiceMoney(invoiceBalance(selectedInvoice), selectedInvoice.currency)}</strong>
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

function formatInvoiceMoney(value, currencyCode) {
  return formatMoney(value, currencyCode);
}
