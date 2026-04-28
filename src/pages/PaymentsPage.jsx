import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import {
  CloseIcon,
  ChevronDownIcon,
} from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { paymentInvoices, paymentModes, paymentRows } from '../data/payments';
import { formatCurrency } from '../utils/formatters';
import {
  invoicePlusIconSrc,
  paymentTotalIconSrc,
  paymentReceivedIconSrc,
  paymentPendingIconSrc,
  paymentUploadIconSrc,
} from '../utils/images';
import '../styles/dashboard.css';
import '../styles/payments.css';

const defaultForm = {
  invoiceId: paymentInvoices[0]?.id ?? '',
  amount: '',
  mode: paymentModes[0],
  reference: 'TXN-001',
  date: '',
};

export default function PaymentsPage({ initialAction }) {
  const [payments, setPayments] = useState(paymentRows);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [selectedFileName, setSelectedFileName] = useState('');

  useEffect(() => {
    if (initialAction === 'add') {
      setForm({
        invoiceId: paymentInvoices.find((invoice) => invoice.status !== 'paid')?.id ?? paymentInvoices[0]?.id ?? '',
        amount: '',
        mode: paymentModes[0],
        reference: 'TXN-001',
        date: '',
      });
      setSelectedFileName('');
      setIsModalOpen(true);
    }
  }, [initialAction]);

  const totals = useMemo(() => {
    const received = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const pendingInvoices = paymentInvoices.filter((invoice) => invoice.status !== 'paid').length;

    return {
      totalPayments: payments.length,
      totalReceived: received,
      pendingInvoices,
    };
  }, [payments]);

  function openModal() {
    setForm({
      invoiceId: paymentInvoices.find((invoice) => invoice.status !== 'paid')?.id ?? paymentInvoices[0]?.id ?? '',
      amount: '',
      mode: paymentModes[0],
      reference: 'TXN-001',
      date: '',
    });
    setSelectedFileName('');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    setSelectedFileName(file ? file.name : '');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const invoice = paymentInvoices.find((entry) => entry.id === form.invoiceId) ?? paymentInvoices[0];

    const payment = {
      id: `pay-${String(payments.length + 1).padStart(3, '0')}`,
      invoiceId: invoice?.id ?? 'inv1',
      date: form.date || '2026-04-22',
      amount: Number(form.amount || invoice?.amount || 0),
      mode: form.mode,
      reference: form.reference || `TXN-${String(payments.length + 1).padStart(3, '0')}`,
    };

    setPayments((current) => [payment, ...current]);
    closeModal();
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
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="payments-invoice-id">{payment.invoiceId}</td>
                      <td>{payment.date}</td>
                      <td className="payments-amount">{formatCurrency(payment.amount)}</td>
                      <td>
                        <span className="payments-pill">{payment.mode}</span>
                      </td>
                      <td>{payment.reference}</td>
                    </tr>
                  ))}
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

            <form className="payments-form" onSubmit={handleSubmit}>
              <div className="payments-modal__body">
                <label className="payments-field">
                  <span>Select Invoice</span>
                  <div className="payments-select">
                    <select name="invoiceId" value={form.invoiceId} onChange={handleChange}>
                      {paymentInvoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.id} - {invoice.client}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon />
                  </div>
                </label>

                <label className="payments-field">
                  <span>Amount</span>
                  <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0" />
                </label>

                <label className="payments-field">
                  <span>Payment Mode</span>
                  <div className="payments-select">
                    <select name="mode" value={form.mode} onChange={handleChange}>
                      {paymentModes.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon />
                  </div>
                </label>

                <label className="payments-field">
                  <span>Reference Number</span>
                  <input name="reference" value={form.reference} onChange={handleChange} placeholder="TXN-001" />
                </label>

                <label className="payments-field">
                  <span>Date</span>
                  <input type="text" name="date" value={form.date} onChange={handleChange} placeholder="" />
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
              </div>

              <div className="payments-modal__footer">
                <button type="button" className="modal-text-button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="payments-modal__primary">
                  Record Payment
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
