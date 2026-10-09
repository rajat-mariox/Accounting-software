import React, { useState } from 'react';
import { CloseIcon } from './dashboard/icons';
import AttachmentPicker from './AttachmentPicker';
import { suppliersApi } from '../api';
import { attachmentHandlers, toAttachmentPayload } from '../utils/attachments';
import { formatCurrency } from '../utils/formatters';
import { isNonEmpty, isPositiveNumber, isValidISODate } from '../utils/validators';
import '../styles/clients.css';
import '../styles/suppliers.css';
import '../styles/form-errors.css';

// Remaining amount owed to the supplier for one supply activity.
export function activityBalance(row) {
  if (!row) return 0;
  if (typeof row.balance === 'number') return row.balance;
  return Math.max(0, Number(row.totalAmount || 0) - Number(row.amountPaid || 0));
}

function validateInstallmentForm(form, activity) {
  const errors = {};
  const balance = activityBalance(activity);
  if (!isPositiveNumber(form.amount)) {
    errors.amount = 'Amount must be greater than 0.';
  } else if (Number(form.amount) > balance + 0.005) {
    errors.amount = `Cannot exceed the remaining balance of ${formatCurrency(balance, activity?.currency)}.`;
  }
  if (isNonEmpty(form.date) && !isValidISODate(form.date)) errors.date = 'Select a valid date.';
  const remaining = balance - (Number(form.amount) || 0);
  if (remaining > 0.005 && !isValidISODate(form.nextPaymentDate)) {
    errors.nextPaymentDate = 'Select when the remaining amount will be paid.';
  }
  return errors;
}

// "Add Supplier Payment" dialog for a partly-paid supply. Used on the Suppliers
// and Payments pages; calls onSaved(updatedActivity) after the installment is recorded.
export default function SupplierPaymentModal({ activity, onCancel, onSaved }) {
  const [form, setForm] = useState(() => ({
    amount: String(activityBalance(activity)),
    date: new Date().toISOString().slice(0, 10),
    reference: '',
    nextPaymentDate: '',
    attachment: null,
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const file = attachmentHandlers(setForm, setErrors);

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

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateInstallmentForm(form, activity);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      const remaining = activityBalance(activity) - Number(form.amount);
      const updated = await suppliersApi.recordActivityPayment(activity.id, {
        amount: Number(form.amount),
        date: form.date || undefined,
        reference: form.reference || undefined,
        nextPaymentDate: remaining > 0.005 ? form.nextPaymentDate : undefined,
        attachment: await toAttachmentPayload(form.attachment),
      });
      onSaved(updated);
    } catch (err) {
      setErrors((current) => ({ ...current, form: err.message || 'Could not record payment' }));
      setSubmitting(false);
    }
  }

  return (
    <InstallmentForm
      activity={activity}
      form={form}
      errors={errors}
      onChange={handleChange}
      onFileChange={file.onFileChange}
      onFileClear={file.onFileClear}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  );
}

function InstallmentForm({ activity, form, errors = {}, onChange, onFileChange, onFileClear, onCancel, onSubmit, submitting }) {
  const balance = activityBalance(activity);
  const remainingAfter = Math.max(0, balance - (Number(form.amount) || 0));
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="client-modal client-modal--supply"
        role="dialog"
        aria-modal="true"
        aria-labelledby="installment-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="client-modal__header">
          <h2 id="installment-title">Add Supplier Payment</h2>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <form className="client-form" onSubmit={onSubmit} noValidate>
          <div className="payment-summary">
            <span><strong>{activity.supplierName}</strong> · {activity.item} × {activity.quantity}</span>
            <span>Total {formatCurrency(activity.totalAmount, activity.currency)} · Paid {formatCurrency(activity.amountPaid || 0, activity.currency)}</span>
            <strong>Remaining {formatCurrency(balance, activity.currency)}</strong>
          </div>

          <label className="client-field">
            <span>Amount Paying Now ({activity.currency || 'base currency'})<span className="client-field__required">*</span></span>
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={onChange}
              aria-invalid={Boolean(errors.amount)}
              className={errors.amount ? 'field-input--invalid' : ''}
            />
            {errors.amount ? <span className="field-error">{errors.amount}</span> : null}
          </label>

          <label className="client-field">
            <span>Payment Date</span>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={onChange}
              aria-invalid={Boolean(errors.date)}
              className={errors.date ? 'field-input--invalid' : ''}
            />
            {errors.date ? <span className="field-error">{errors.date}</span> : null}
          </label>

          <label className="client-field">
            <span>Reference</span>
            <input name="reference" type="text" placeholder="Transaction / cheque no." value={form.reference} onChange={onChange} />
          </label>

          <AttachmentPicker
            label="Attach Invoice / Receipt"
            prompt="Click to attach the supplier's invoice or receipt for this payment"
            file={form.attachment}
            error={errors.attachment}
            onFileChange={onFileChange}
            onFileClear={onFileClear}
            disabled={submitting}
          />

          <div className={`record-total record-total--${remainingAfter > 0 ? 'due' : 'clear'}`}>
            <span>Remaining After This Payment:</span>
            <strong>{formatCurrency(remainingAfter, activity.currency)}</strong>
          </div>

          {remainingAfter > 0 ? (
            <label className="client-field">
              <span>Next Payment Date<span className="client-field__required">*</span></span>
              <input
                name="nextPaymentDate"
                type="date"
                value={form.nextPaymentDate}
                onChange={onChange}
                aria-invalid={Boolean(errors.nextPaymentDate)}
                className={errors.nextPaymentDate ? 'field-input--invalid' : ''}
              />
              {errors.nextPaymentDate ? <span className="field-error">{errors.nextPaymentDate}</span> : null}
              <span className="field-hint">You will be reminded 3 days before this date.</span>
            </label>
          ) : null}

          {errors.form ? <span className="field-error">{errors.form}</span> : null}

          <div className="client-form__actions">
            <button type="button" className="modal-text-button" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="modal-primary-button" disabled={submitting}>
              {submitting ? 'Saving…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
