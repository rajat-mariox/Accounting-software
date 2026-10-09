import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import {
  CloseIcon,
  ChevronDownIcon,
  ViewIcon,
} from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { can, getStoredUser } from '../utils/auth';
import { paymentModes } from '../data/payments';
import { paymentsApi, invoicesApi, suppliersApi } from '../api';
import { formatCurrency } from '../utils/formatters';
import { baseCurrency, crossRate, formatDisplayDate, formatMoney as formatInCurrency, getCurrencySettings, toBase } from '../utils/currency';
import { openBlobInNewTab } from '../utils/attachments';
import SupplierPaymentModal, { activityBalance } from '../components/SupplierPaymentModal';
import { isNonEmpty, isPositiveNumber, isValidISODate } from '../utils/validators';
import {
  invoicePlusIconSrc,
  paymentTotalIconSrc,
  paymentReceivedIconSrc,
  paymentPendingIconSrc,
  paymentUploadIconSrc,
} from '../utils/images';
import '../styles/dashboard.css';
import '../styles/payments.css';
import '../styles/form-errors.css';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  return formatDisplayDate(value);
}

const defaultForm = {
  invoiceId: '',
  amount: '',
  mode: paymentModes[0],
  reference: '',
  date: todayISO(),
  // Paid in a different currency than the invoice.
  foreign: false,
  recvCurrency: '',
  recvAmount: '',
  recvRate: '',
  // 'perInvoice': rate = received units per 1 invoice unit (e.g. 1 USD = 571 SOS);
  // 'perReceived': rate = invoice units per 1 received unit. The form always uses
  // the direction where the rate is 1 or more so it reads naturally and stays exact.
  recvRateDir: 'perInvoice',
};

function invoiceBalance(invoice) {
  if (!invoice) return 0;
  if (typeof invoice.balance === 'number') return invoice.balance;
  return Math.max(0, Number(invoice.amount || 0) - Number(invoice.amountPaid || 0));
}

const SUPPLY_STATUS_LABEL = {
  pending: 'Unpaid',
  partial: 'Partially Paid',
  overdue: 'Overdue',
  paid: 'Paid',
};

const PAYMENT_TABS = [
  { id: 'clients', label: 'Client Payments' },
  { id: 'suppliers', label: 'Supplier Payments' },
];

function formatMoney(value, currencyCode) {
  return formatInCurrency(value, currencyCode);
}

// Invoice credit for a payment handed over in another currency.
function foreignCredit(form) {
  const amount = Number(form.recvAmount);
  const rate = Number(form.recvRate);
  if (!(amount > 0) || !(rate > 0)) return 0;
  const credit = form.recvRateDir === 'perReceived' ? amount * rate : amount / rate;
  return Math.round(credit * 100) / 100;
}

// Rate sent to the server: always units of the received currency per 1 invoice unit.
function serverRate(form) {
  const rate = Number(form.recvRate);
  return form.recvRateDir === 'perReceived' ? 1 / rate : rate;
}

function validatePaymentForm(form, invoice) {
  const errors = {};
  if (!isNonEmpty(form.invoiceId)) errors.invoiceId = 'Select an invoice.';
  if (form.foreign) {
    if (!isPositiveNumber(form.recvAmount)) errors.recvAmount = 'Enter the amount the client handed over.';
    if (!isPositiveNumber(form.recvRate)) errors.recvRate = 'Exchange rate must be greater than 0.';
  }
  const credit = form.foreign ? foreignCredit(form) : Number(form.amount);
  if (!form.foreign && !isPositiveNumber(form.amount)) {
    errors.amount = 'Amount must be greater than 0.';
  } else if (invoice && credit > invoiceBalance(invoice) + 0.005) {
    errors[form.foreign ? 'recvAmount' : 'amount'] = `Cannot exceed the outstanding balance of ${formatMoney(invoiceBalance(invoice), invoice.currency)}.`;
  }
  if (!isNonEmpty(form.mode)) errors.mode = 'Select a payment mode.';
  if (!isNonEmpty(form.reference)) {
    errors.reference = 'Reference number is required.';
  }
  if (!isValidISODate(form.date)) {
    errors.date = 'Select a valid date.';
  }
  return errors;
}

export default function PaymentsPage({ initialAction }) {
  // Client portal logins see only their own payments. Staff with supplier access get
  // two tabs: client receipts, and supplier payouts (pay off part-paid supplies here).
  const isClient = getStoredUser()?.role === 'Client';
  const showSuppliers = !isClient && can('suppliers', 'view');
  const canPaySuppliers = showSuppliers && can('suppliers', 'edit');
  const [activeTab, setActiveTab] = useState('clients');
  const [activities, setActivities] = useState([]);
  const [payingActivity, setPayingActivity] = useState(null);
  const [notice, setNotice] = useState('');
  const [payments, setPayments] = useState([]);
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [supplierError, setSupplierError] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [selectedFileName, setSelectedFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([paymentsApi.list(), invoicesApi.list()])
      .then(([paymentRows, invoiceRows]) => {
        if (cancelled) return;
        setPayments(paymentRows);
        setInvoices(invoiceRows);
      })
      .catch((err) => !cancelled && setLoadError(err.message || 'Failed to load payments'))
      .finally(() => !cancelled && setLoading(false));
    if (showSuppliers) {
      suppliersApi
        .listPayments()
        .then((rows) => !cancelled && setSupplierPayments(rows))
        .catch((err) => !cancelled && setSupplierError(err.message || 'Failed to load supplier payments'));
      suppliersApi
        .listActivities()
        .then((rows) => !cancelled && setActivities(rows))
        .catch((err) => !cancelled && setSupplierError(err.message || 'Failed to load supplies'));
    }
    return () => {
      cancelled = true;
    };
  }, [showSuppliers]);

  useEffect(() => {
    if (initialAction === 'add' && !loading && invoices.length > 0) {
      openModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAction, loading]);

  const totals = useMemo(() => {
    // Documents can be in different currencies; every total is converted to the base currency.
    const received = payments.reduce((sum, payment) => sum + toBase(payment.amount, payment.exchangeRate), 0);
    const pendingInvoices = invoices.filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled').length;
    const paidToSuppliers = supplierPayments.reduce((sum, payment) => sum + toBase(payment.amount, payment.exchangeRate), 0);
    const owedToSuppliers = activities.reduce((sum, activity) => sum + toBase(activityBalance(activity), activity.exchangeRate), 0);
    return {
      totalPayments: payments.length,
      totalReceived: received,
      // What clients still owe today: remaining balance on every non-cancelled invoice.
      dueFromClients: invoices
        .filter((invoice) => invoice.status !== 'cancelled')
        .reduce((sum, invoice) => sum + toBase(invoiceBalance(invoice), invoice.exchangeRate), 0),
      pendingInvoices,
      paidToSuppliers,
      owedToSuppliers,
    };
  }, [payments, invoices, supplierPayments, activities]);

  // Supplies that still have money owed, oldest promised date first.
  const openSupplies = useMemo(
    () =>
      activities
        .filter((activity) => activityBalance(activity) > 0)
        .sort((a, b) => new Date(a.nextPaymentDate || a.date) - new Date(b.nextPaymentDate || b.date)),
    [activities]
  );

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function handleSupplierPaymentSaved(updated) {
    setPayingActivity(null);
    setActivities((current) => current.map((row) => (row.id === updated.id ? updated : row)));
    const balance = activityBalance(updated);
    setNotice(
      balance > 0
        ? `Payment recorded for ${updated.supplierName}. ${formatCurrency(balance, updated.currency)} still owed.`
        : `Payment recorded. ${updated.supplierName} is fully paid for ${updated.item}.`,
    );
    try {
      setSupplierPayments(await suppliersApi.listPayments());
    } catch {
      // the history refreshes on the next visit
    }
  }

  function openSupplierAttachment(payment) {
    openBlobInNewTab(() => suppliersApi.fetchPaymentAttachment(payment.activity, payment.id)).catch((err) =>
      setSupplierError(err.message || 'Could not open the attached invoice'),
    );
  }

  const invoiceById = useMemo(() => new Map(invoices.map((invoice) => [invoice.id, invoice])), [invoices]);

  const clientNameByInvoice = useMemo(
    () => new Map(invoices.map((invoice) => [invoice.id, invoice.clientName])),
    [invoices]
  );

  function openModal() {
    const firstUnpaid = openInvoices[0];
    setForm({
      invoiceId: firstUnpaid?.id ?? '',
      amount: firstUnpaid ? String(invoiceBalance(firstUnpaid)) : '',
      mode: paymentModes[0],
      reference: `TXN-${String(payments.length + 1).padStart(3, '0')}`,
      date: todayISO(),
    });
    setErrors({});
    setSelectedFileName('');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setErrors({});
  }

  const openInvoices = invoices.filter((invoice) => invoice.status !== 'cancelled' && invoiceBalance(invoice) > 0);
  const selectedInvoice = invoices.find((invoice) => invoice.id === form.invoiceId) || null;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      // Picking an invoice pre-fills the outstanding balance; user can lower it for a partial payment.
      if (name === 'invoiceId') {
        const invoice = invoices.find((row) => row.id === value);
        next.amount = invoice ? String(invoiceBalance(invoice)) : '';
        next.foreign = false;
      }
      if (name === 'foreign' || name === 'recvCurrency') {
        const invoice = invoices.find((row) => row.id === next.invoiceId);
        const invCode = invoice?.currency || baseCurrency();
        if (name === 'foreign') {
          next.foreign = event.target.checked;
          next.recvCurrency = getCurrencySettings().currencies.find((c) => c.code !== invCode)?.code || invCode;
        }
        // Show the rate in the direction where it is 1 or more (e.g. 1 USD = 571 SOS).
        const cross = crossRate(next.recvCurrency, invCode); // received units per 1 invoice unit
        next.recvRateDir = cross >= 1 ? 'perInvoice' : 'perReceived';
        const shown = cross >= 1 ? cross : 1 / cross;
        next.recvRate = String(Math.round(shown * 1e6) / 1e6);
      }
      return next;
    });
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    setSelectedFileName(file ? file.name : '');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validatePaymentForm(form, selectedInvoice);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        invoice: form.invoiceId,
        amount: form.foreign ? foreignCredit(form) : Number(form.amount),
        mode: form.mode,
        reference: form.reference,
        date: form.date,
        ...(form.foreign
          ? { received: { amount: Number(form.recvAmount), currency: form.recvCurrency, rate: serverRate(form) } }
          : {}),
      };
      const created = await paymentsApi.create(payload);
      setPayments((current) => [created, ...current]);
      // backend marks invoice as paid when fully covered — refresh list
      try {
        const refreshed = await invoicesApi.list();
        setInvoices(refreshed);
      } catch {
        // ignore
      }
      closeModal();
    } catch (err) {
      setErrors({ form: err.message || 'Could not record payment' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <DashboardSidebar brand={{ title: 'Jubba group', subtitle: 'ERP System' }} items={sidebarItems} />

      <section className="dashboard-main">
        <DashboardTopbar />

        <div className="dashboard-content payments-content">
          <div className="payments-header">
            <div className="dashboard-heading">
              <h1>{isClient ? 'My Payments' : 'Payments'}</h1>
              <p>{isClient ? 'Payments you have made against your invoices' : 'Track client receipts and supplier payouts'}</p>
            </div>

          </div>

          <section className={`payments-stats${!showSuppliers || activeTab === 'clients' ? ' payments-stats--four' : ''}`}>
            {isClient ? (
              <>
                <StatCard iconSrc={paymentTotalIconSrc} label="Payments Made" value={totals.totalPayments} tone="green" />
                <StatCard iconSrc={paymentReceivedIconSrc} label={`Total Paid (${baseCurrency()})`} value={formatCurrency(totals.totalReceived)} tone="blue" />
                <StatCard iconSrc={paymentPendingIconSrc} label="Unpaid Invoices" value={totals.pendingInvoices} tone="yellow" />
                <StatCard iconSrc={paymentPendingIconSrc} label={`Amount Due (${baseCurrency()})`} value={formatMoney(totals.dueFromClients)} tone="red" />
              </>
            ) : showSuppliers && activeTab === 'suppliers' ? (
              <>
                <StatCard iconSrc={paymentTotalIconSrc} label={`Paid to Suppliers (${baseCurrency()})`} value={formatCurrency(totals.paidToSuppliers)} tone="green" />
                <StatCard iconSrc={paymentReceivedIconSrc} label={`Still Owed to Suppliers (${baseCurrency()})`} value={formatCurrency(totals.owedToSuppliers)} tone="blue" />
                <StatCard iconSrc={paymentPendingIconSrc} label="Supplies Not Fully Paid" value={openSupplies.length} tone="yellow" />
              </>
            ) : (
              <>
                <StatCard iconSrc={paymentReceivedIconSrc} label={`Received from Clients (${baseCurrency()})`} value={formatCurrency(totals.totalReceived)} tone="green" />
                <StatCard iconSrc={paymentTotalIconSrc} label="Total Payments" value={totals.totalPayments} tone="blue" />
                <StatCard iconSrc={paymentPendingIconSrc} label="Pending Invoices" value={totals.pendingInvoices} tone="yellow" />
                <StatCard iconSrc={paymentPendingIconSrc} label={`Due from Clients (${baseCurrency()})`} value={formatMoney(totals.dueFromClients)} tone="red" />
              </>
            )}
          </section>

          {showSuppliers || (!isClient && can('payments', 'create')) ? (
            <div className="payments-toolbar">
              {showSuppliers ? (
                <div className="payments-tabs" role="tablist" aria-label="Payment sections">
                  {PAYMENT_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      className={`payments-tab${activeTab === tab.id ? ' payments-tab--active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                      <span className="payments-tab__count">
                        {tab.id === 'clients' ? payments.length : supplierPayments.length}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              {!isClient && can('payments', 'create') && (!showSuppliers || activeTab === 'clients') ? (
              <button type="button" className="payments-create-button" onClick={openModal}>
                <img
                  src={invoicePlusIconSrc}
                  alt=""
                  aria-hidden="true"
                  className="payments-create-button__icon"
                />
                Record Payment
              </button>
              ) : null}
            </div>
          ) : null}

          {notice ? <p className="payments-notice" role="status">{notice}</p> : null}

          {loadError ? <p className="auth-error">{loadError}</p> : null}

          {!showSuppliers || activeTab === 'clients' ? (
            <section className="payments-card">
              <div className="payments-card__head">
                <h2 className="payments-card__title">{isClient ? 'Payment History' : 'Client Payments'}</h2>
                <span className="payments-card__count">{payments.length}</span>
              </div>

              <div className="table-wrap">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      {isClient ? null : <th>Client</th>}
                      <th>Goods</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Reference</th>
                      <th>Due Now</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && payments.length === 0 ? (
                      <tr><td colSpan={isClient ? 7 : 8}>Loading…</td></tr>
                    ) : payments.length === 0 ? (
                      <tr><td colSpan={isClient ? 7 : 8}>No payments recorded yet.</td></tr>
                    ) : (
                      payments.map((payment) => {
                        const invoiceId = typeof payment.invoice === 'object' ? payment.invoice?.id : payment.invoice;
                        return (
                          <tr key={payment.id}>
                            <td className="payments-invoice-id">{payment.invoiceNumber || invoiceId}</td>
                            {isClient ? null : <td>{clientNameByInvoice.get(invoiceId) || '—'}</td>}
                            <InvoiceGoodsCell invoice={invoiceById.get(invoiceId)} />
                            <td>{formatDate(payment.date)}</td>
                            <td className="payments-amount">
                              {formatCurrency(payment.amount, payment.currency)}
                              {payment.received?.amount ? (
                                <span className="payments-subtext">
                                  paid as {formatCurrency(payment.received.amount, payment.received.currency)}
                                </span>
                              ) : null}
                            </td>
                            <td>
                              <span className="payments-pill">{payment.mode}</span>
                            </td>
                            <td>{payment.reference}</td>
                            <InvoiceDueCell invoice={invoiceById.get(invoiceId)} />
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {showSuppliers && activeTab === 'suppliers' ? (
            <>
              {supplierError ? <p className="auth-error">{supplierError}</p> : null}

              <section className="payments-card">
                <div className="payments-card__head">
                  <div>
                    <h2 className="payments-card__title">Pending Supplier Payments</h2>
                    <p className="payments-card__subtitle">Supplies that are unpaid or partly paid. Use Add Payment to pay the next installment.</p>
                  </div>
                  <span className="payments-card__count">{openSupplies.length}</span>
                </div>

                <div className="table-wrap">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Supplier</th>
                        <th>Item</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Remaining</th>
                        <th>Next Payment</th>
                        <th>Status</th>
                        {canPaySuppliers ? <th>Action</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {loading && activities.length === 0 ? (
                        <tr><td colSpan="8">Loading…</td></tr>
                      ) : openSupplies.length === 0 ? (
                        <tr><td colSpan="8">Every supply is fully paid.</td></tr>
                      ) : (
                        openSupplies.map((activity) => (
                          <tr key={activity.id}>
                            <td className="payments-invoice-id">{activity.supplierName}</td>
                            <td>
                              {activity.item} × {activity.quantity}
                              {activity.invoiceNumber ? <span className="payments-subtext">{activity.invoiceNumber}</span> : null}
                            </td>
                            <td>{formatCurrency(activity.totalAmount, activity.currency)}</td>
                            <td>{formatCurrency(activity.amountPaid || 0, activity.currency)}</td>
                            <td className="payments-owed">{formatCurrency(activityBalance(activity), activity.currency)}</td>
                            <td className={activity.paymentStatus === 'overdue' ? 'payments-owed' : undefined}>
                              {formatDate(activity.nextPaymentDate) || '—'}
                            </td>
                            <td>
                              <span className={`payments-status payments-status--${activity.paymentStatus || 'pending'}`}>
                                {SUPPLY_STATUS_LABEL[activity.paymentStatus] || activity.paymentStatus || 'Unpaid'}
                              </span>
                            </td>
                            {canPaySuppliers ? (
                              <td>
                                <button type="button" className="payments-pay-button" onClick={() => setPayingActivity(activity)}>
                                  Add Payment
                                </button>
                              </td>
                            ) : null}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="payments-card">
                <div className="payments-card__head">
                  <h2 className="payments-card__title">Supplier Payment History</h2>
                  <span className="payments-card__count">{supplierPayments.length}</span>
                </div>

                <div className="table-wrap">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Supplier</th>
                        <th>Item</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && supplierPayments.length === 0 ? (
                        <tr><td colSpan="5">Loading…</td></tr>
                      ) : supplierPayments.length === 0 ? (
                        <tr><td colSpan="5">No supplier payments yet.</td></tr>
                      ) : (
                        supplierPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="payments-invoice-id">{payment.supplierName}</td>
                            <td>
                              {payment.item}
                              {payment.invoiceNumber ? <span className="payments-subtext">{payment.invoiceNumber}</span> : null}
                            </td>
                            <td>{formatDate(payment.date)}</td>
                            <td className="payments-amount payments-amount--out">{formatCurrency(payment.amount, payment.currency)}</td>
                            <td>
                              <span className="attachment-inline">
                                {payment.reference || '—'}
                                {payment.attachment?.name ? (
                                  <button
                                    type="button"
                                    className="attachment-view-button"
                                    onClick={() => openSupplierAttachment(payment)}
                                    title={`View attached invoice: ${payment.attachment.name}`}
                                    aria-label={`View attached invoice ${payment.attachment.name}`}
                                  >
                                    <ViewIcon />
                                  </button>
                                ) : null}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </section>

      {payingActivity ? (
        <SupplierPaymentModal
          activity={payingActivity}
          onCancel={() => setPayingActivity(null)}
          onSaved={handleSupplierPaymentSaved}
        />
      ) : null}

      {isModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <section className="payments-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="payments-modal__header">
              <h2>Record Payment</h2>
              <button type="button" className="modal-close" onClick={closeModal} aria-label="Close modal">
                <CloseIcon />
              </button>
            </div>

            <form className="payments-form" onSubmit={handleSubmit} noValidate>
              <div className="payments-modal__body">
                <label className="payments-field">
                  <span>Select Invoice</span>
                  <div className="payments-select">
                    <select
                      name="invoiceId"
                      value={form.invoiceId}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.invoiceId)}
                      className={errors.invoiceId ? 'field-input--invalid' : ''}
                    >
                      <option value="" disabled></option>
                      {openInvoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {(invoice.invoiceNumber || invoice.id)} - {invoice.clientName} · balance {formatMoney(invoiceBalance(invoice), invoice.currency)}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon />
                  </div>
                  {errors.invoiceId ? <span className="field-error">{errors.invoiceId}</span> : null}
                </label>

                {!form.foreign ? (
                <label className="payments-field">
                  <span>Amount ({selectedInvoice?.currency || baseCurrency()})</span>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0"
                    min="0.01"
                    step="0.01"
                    aria-invalid={Boolean(errors.amount)}
                    className={errors.amount ? 'field-input--invalid' : ''}
                  />
                  {errors.amount ? <span className="field-error">{errors.amount}</span> : null}
                </label>
                ) : null}

                {selectedInvoice && getCurrencySettings().currencies.length > 1 ? (
                  <label className="payments-check">
                    <input type="checkbox" name="foreign" checked={form.foreign} onChange={handleChange} />
                    <span>Client paid in a different currency</span>
                  </label>
                ) : null}

                {form.foreign && selectedInvoice ? (
                  <div className="payments-foreign">
                    <label className="payments-field">
                      <span>Currency received</span>
                      <div className="payments-select">
                        <select name="recvCurrency" value={form.recvCurrency} onChange={handleChange}>
                          {getCurrencySettings().currencies
                            .filter((c) => c.code !== (selectedInvoice.currency || baseCurrency()))
                            .map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code} · {c.name}
                              </option>
                            ))}
                        </select>
                        <ChevronDownIcon />
                      </div>
                    </label>
                    <label className="payments-field">
                      <span>Amount received ({form.recvCurrency})</span>
                      <input
                        type="number"
                        name="recvAmount"
                        value={form.recvAmount}
                        onChange={handleChange}
                        min="0.01"
                        step="0.01"
                        aria-invalid={Boolean(errors.recvAmount)}
                        className={errors.recvAmount ? 'field-input--invalid' : ''}
                      />
                      {errors.recvAmount ? <span className="field-error">{errors.recvAmount}</span> : null}
                    </label>
                    <label className="payments-field">
                      <span>
                        {form.recvRateDir === 'perReceived'
                          ? `Rate (1 ${form.recvCurrency} = ? ${selectedInvoice.currency || baseCurrency()})`
                          : `Rate (1 ${selectedInvoice.currency || baseCurrency()} = ? ${form.recvCurrency})`}
                      </span>
                      <input
                        type="number"
                        name="recvRate"
                        value={form.recvRate}
                        onChange={handleChange}
                        min="0"
                        step="any"
                        aria-invalid={Boolean(errors.recvRate)}
                        className={errors.recvRate ? 'field-input--invalid' : ''}
                      />
                      {errors.recvRate ? <span className="field-error">{errors.recvRate}</span> : null}
                    </label>
                    <p className="payments-foreign__credit">
                      Credits <strong>{formatMoney(foreignCredit(form), selectedInvoice.currency)}</strong> to {selectedInvoice.invoiceNumber}
                      {' '}· balance {formatMoney(invoiceBalance(selectedInvoice), selectedInvoice.currency)}
                    </p>
                  </div>
                ) : null}

                <label className="payments-field">
                  <span>Payment Mode</span>
                  <div className="payments-select">
                    <select
                      name="mode"
                      value={form.mode}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.mode)}
                      className={errors.mode ? 'field-input--invalid' : ''}
                    >
                      {paymentModes.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon />
                  </div>
                  {errors.mode ? <span className="field-error">{errors.mode}</span> : null}
                </label>

                <label className="payments-field">
                  <span>Reference Number</span>
                  <input
                    name="reference"
                    value={form.reference}
                    onChange={handleChange}
                    placeholder="TXN-001"
                    aria-invalid={Boolean(errors.reference)}
                    className={errors.reference ? 'field-input--invalid' : ''}
                  />
                  {errors.reference ? <span className="field-error">{errors.reference}</span> : null}
                </label>

                <label className="payments-field">
                  <span>Date</span>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    placeholder="YYYY-MM-DD"
                    aria-invalid={Boolean(errors.date)}
                    className={errors.date ? 'field-input--invalid' : ''}
                  />
                  {errors.date ? <span className="field-error">{errors.date}</span> : null}
                </label>

                <label className="payments-upload">
                  <span>Upload Document (Check/Deposit Slip)</span>
                  <div className="payments-upload__dropzone">
                    <input type="file" onChange={handleFileChange} aria-label="Upload payment document" />
                    <img src={paymentUploadIconSrc} alt="" aria-hidden="true" />
                    <span>{selectedFileName || 'Click to upload document'}</span>
                  </div>
                  <p>Upload check, deposit slip, or payment receipt (PDF or Image)</p>
                </label>

                {errors.form ? <span className="field-error">{errors.form}</span> : null}
              </div>

              <div className="payments-modal__footer">
                <button type="button" className="modal-text-button" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="payments-modal__primary" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Record Payment'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

    </main>
  );
}

// Goods on the payment's invoice, e.g. "36 × Mouse", one line per item.
function InvoiceGoodsCell({ invoice }) {
  const items = invoice?.items || [];
  if (items.length === 0) return <td>—</td>;
  return (
    <td className="payments-goods">
      {items.map((line, index) => (
        <span key={`${line.name}-${index}`} className="payments-goods__line">
          {line.quantity} × {line.name}
        </span>
      ))}
    </td>
  );
}

// Current remaining balance of the payment's invoice (same for every payment on it).
function InvoiceDueCell({ invoice }) {
  if (!invoice || invoice.status === 'cancelled') return <td>—</td>;
  const due = invoiceBalance(invoice);
  return due > 0 ? (
    <td className="payments-due">{formatMoney(due, invoice.currency)}</td>
  ) : (
    <td className="payments-due payments-due--clear">Paid</td>
  );
}

function StatCard({ iconSrc, label, value, tone }) {
  return (
    <article className="payment-stat-card">
      <div className={`payment-stat-card__icon payment-stat-card__icon--${tone}`}>
        <img src={iconSrc} alt="" aria-hidden="true" />
      </div>
      <div className="payment-stat-card__text">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
