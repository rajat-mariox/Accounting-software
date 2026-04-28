import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import {
  CloseIcon,
  ChevronDownIcon,
} from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { paymentModes } from '../data/payments';
import { paymentsApi, invoicesApi } from '../api';
import { formatCurrency } from '../utils/formatters';
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
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

const defaultForm = {
  invoiceId: '',
  amount: '',
  mode: paymentModes[0],
  reference: '',
  date: todayISO(),
};

function validatePaymentForm(form) {
  const errors = {};
  if (!isNonEmpty(form.invoiceId)) errors.invoiceId = 'Select an invoice.';
  if (!isPositiveNumber(form.amount)) {
    errors.amount = 'Amount must be greater than 0.';
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
  const [payments, setPayments] = useState([]);
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
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (initialAction === 'add' && !loading && invoices.length > 0) {
      openModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAction, loading]);

  const totals = useMemo(() => {
    const received = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const pendingInvoices = invoices.filter((invoice) => invoice.status !== 'paid').length;
    return {
      totalPayments: payments.length,
      totalReceived: received,
      pendingInvoices,
    };
  }, [payments, invoices]);

  function openModal() {
    const firstUnpaid = invoices.find((invoice) => invoice.status !== 'paid') ?? invoices[0];
    setForm({
      invoiceId: firstUnpaid?.id ?? '',
      amount: firstUnpaid?.amount ? String(firstUnpaid.amount) : '',
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

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
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
    const validationErrors = validatePaymentForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        invoice: form.invoiceId,
        amount: Number(form.amount),
        mode: form.mode,
        reference: form.reference,
        date: form.date,
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
              <h1>Payments</h1>
              <p>Track and record payments</p>
            </div>

            <button type="button" className="payments-create-button" onClick={openModal}>
              <img
                src={invoicePlusIconSrc}
                alt=""
                aria-hidden="true"
                className="payments-create-button__icon"
              />
              Record Payment
            </button>
          </div>

          <section className="payments-stats">
            <StatCard iconSrc={paymentTotalIconSrc} label="Total Payments" value={totals.totalPayments} tone="green" />
            <StatCard iconSrc={paymentReceivedIconSrc} label="Total Received" value={formatCurrency(totals.totalReceived)} tone="blue" />
            <StatCard iconSrc={paymentPendingIconSrc} label="Pending Invoices" value={totals.pendingInvoices} tone="yellow" />
          </section>

          <section className="payments-card">
            <h2 className="payments-card__title">Payment History</h2>

            {loadError ? <p className="auth-error">{loadError}</p> : null}

            <div className="table-wrap">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Mode</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && payments.length === 0 ? (
                    <tr><td colSpan="5">Loading…</td></tr>
                  ) : payments.length === 0 ? (
                    <tr><td colSpan="5">No payments recorded yet.</td></tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="payments-invoice-id">{payment.invoiceNumber || payment.invoice}</td>
                        <td>{formatDate(payment.date)}</td>
                        <td className="payments-amount">{formatCurrency(payment.amount)}</td>
                        <td>
                          <span className="payments-pill">{payment.mode}</span>
                        </td>
                        <td>{payment.reference}</td>
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
                      {invoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {(invoice.invoiceNumber || invoice.id)} - {invoice.clientName}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon />
                  </div>
                  {errors.invoiceId ? <span className="field-error">{errors.invoiceId}</span> : null}
                </label>

                <label className="payments-field">
                  <span>Amount</span>
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
