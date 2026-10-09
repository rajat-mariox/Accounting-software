import React, { useEffect, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { CheckCircleIcon, CloseIcon, PlusIcon, TrashIcon, ViewIcon } from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { suppliersApi } from '../api';
import AttachmentPicker from '../components/AttachmentPicker';
import SupplierPaymentModal from '../components/SupplierPaymentModal';
import { attachmentHandlers, openBlobInNewTab, toAttachmentPayload } from '../utils/attachments';
import { formatCurrency } from '../utils/formatters';
import { baseCurrency, formatDisplayDate, formatMoney, getCurrencySettings } from '../utils/currency';
import {
  isNonEmpty,
  isPositiveInteger,
  isPositiveNumber,
  isValidEmail,
  isValidISODate,
  isValidPhone,
  sanitizePhoneInput,
} from '../utils/validators';
import '../styles/dashboard.css';
import '../styles/clients.css';
import '../styles/suppliers.css';
import '../styles/form-errors.css';

const tabOptions = [
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'activities', label: 'Supply Activities' },
];

const emptySupplierForm = {
  name: '',
  company: '',
  email: '',
  phone: '',
  address: '',
};

const emptyActivityForm = {
  supplier: '',
  item: '',
  quantity: '',
  pricePerUnit: '',
  invoice: '',
  date: '',
  amountPaid: '',
  nextPaymentDate: '',
  attachment: null,
  currency: '',
};

const PAYMENT_STATUS_LABEL = {
  pending: 'Unpaid',
  partial: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
};

function activityBalance(row) {
  if (!row) return 0;
  if (typeof row.balance === 'number') return row.balance;
  return Math.max(0, Number(row.totalAmount || 0) - Number(row.amountPaid || 0));
}

function activityTotal(form) {
  return (Number(form.quantity) || 0) * (Number(form.pricePerUnit) || 0);
}

function validateSupplierForm(form) {
  const errors = {};
  if (!isNonEmpty(form.name)) errors.name = 'Supplier name is required.';
  if (!isNonEmpty(form.company)) errors.company = 'Company is required.';
  if (!isNonEmpty(form.email)) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(form.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!isNonEmpty(form.phone)) {
    errors.phone = 'Phone is required.';
  } else if (!isValidPhone(form.phone)) {
    errors.phone = 'Phone must be exactly 10 digits.';
  }
  return errors;
}

function validateActivityForm(form) {
  const errors = {};
  if (!isNonEmpty(form.supplier)) errors.supplier = 'Select a supplier.';
  if (!isNonEmpty(form.item)) errors.item = 'Enter an item name.';
  if (!isPositiveInteger(form.quantity)) {
    errors.quantity = 'Quantity must be a whole number greater than 0.';
  }
  if (!isPositiveNumber(form.pricePerUnit)) {
    errors.pricePerUnit = 'Price per unit must be greater than 0.';
  }
  if (!isValidISODate(form.date)) {
    errors.date = 'Select a valid date.';
  }
  const total = activityTotal(form);
  const paid = form.amountPaid === '' ? 0 : Number(form.amountPaid);
  if (!Number.isFinite(paid) || paid < 0) {
    errors.amountPaid = 'Amount paid must be 0 or more.';
  } else if (paid > total + 0.005) {
    errors.amountPaid = 'Amount paid cannot exceed the total amount.';
  }
  const remaining = total - (Number.isFinite(paid) ? paid : 0);
  if (remaining > 0.005) {
    if (!isValidISODate(form.nextPaymentDate)) {
      errors.nextPaymentDate = 'Select when the remaining amount will be paid.';
    } else if (isValidISODate(form.date) && form.nextPaymentDate < form.date) {
      errors.nextPaymentDate = 'Next payment date cannot be before the supply date.';
    }
  }
  return errors;
}

function formatDate(value) {
  return formatDisplayDate(value);
}

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [form, setForm] = useState(emptySupplierForm);
  const [activityForm, setActivityForm] = useState(emptyActivityForm);
  const [errors, setErrors] = useState({});
  const [activityErrors, setActivityErrors] = useState({});
  const [payingActivity, setPayingActivity] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isAddOpen = modalMode === 'add';
  const isEditOpen = modalMode === 'edit';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([suppliersApi.list(), suppliersApi.listActivities()])
      .then(([suppliersRows, activityRows]) => {
        if (cancelled) return;
        setSuppliers(suppliersRows);
        setActivities(activityRows);
      })
      .catch((err) => !cancelled && setLoadError(err.message || 'Failed to load suppliers'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    const nextValue = name === 'phone' ? sanitizePhoneInput(value) : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function handleActivityChange(event) {
    const { name, value } = event.target;
    setActivityForm((current) => ({ ...current, [name]: value }));
    setActivityErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateSupplierForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      const created = await suppliersApi.create(form);
      setSuppliers((current) => [created, ...current]);
      setForm(emptySupplierForm);
      setErrors({});
      setModalMode(null);
      setToast('Supplier added successfully');
    } catch (err) {
      setErrors({ form: err.message || 'Could not add supplier' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(event) {
    event.preventDefault();
    const validationErrors = validateSupplierForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      const updated = await suppliersApi.update(editing.id, form);
      setSuppliers((current) =>
        current.map((row) => (row.id === editing.id ? { ...row, ...updated } : row)),
      );
      setForm(emptySupplierForm);
      setErrors({});
      setEditing(null);
      setModalMode(null);
      setToast('Supplier updated successfully');
    } catch (err) {
      setErrors({ form: err.message || 'Could not update supplier' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingSupplier) return;
    setSubmitting(true);
    try {
      await suppliersApi.remove(deletingSupplier.id);
      setSuppliers((current) => current.filter((row) => row.id !== deletingSupplier.id));
      setDeletingSupplier(null);
      setModalMode(null);
      setToast('Supplier deleted successfully');
    } catch (err) {
      setErrors({ form: err.message || 'Could not delete supplier' });
    } finally {
      setSubmitting(false);
    }
  }

  const activityFile = attachmentHandlers(setActivityForm, setActivityErrors);

  function openAttachment(row) {
    openBlobInNewTab(() => suppliersApi.fetchActivityAttachment(row.id)).catch((err) =>
      setToast(err.message || 'Could not open the attached invoice'),
    );
  }

  async function handleRecordSubmit(event) {
    event.preventDefault();
    const validationErrors = validateActivityForm(activityForm);
    if (Object.keys(validationErrors).length > 0) {
      setActivityErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        supplier: activityForm.supplier,
        item: activityForm.item,
        quantity: Number(activityForm.quantity),
        pricePerUnit: Number(activityForm.pricePerUnit),
        date: activityForm.date,
        invoiceNumber: activityForm.invoice || undefined,
        currency: activityForm.currency || baseCurrency(),
        amountPaid: activityForm.amountPaid === '' ? 0 : Number(activityForm.amountPaid),
        nextPaymentDate: activityForm.nextPaymentDate || undefined,
      };
      payload.attachment = await toAttachmentPayload(activityForm.attachment);
      const created = await suppliersApi.createActivity(payload);
      setActivities((current) => [created, ...current]);
      // refresh supplier aggregates
      try {
        const refreshed = await suppliersApi.list();
        setSuppliers(refreshed);
      } catch {
        // ignore
      }
      setActivityForm(emptyActivityForm);
      setActivityErrors({});
      setIsRecordOpen(false);
      setToast('Supply activity recorded successfully');
    } catch (err) {
      setActivityErrors({ form: err.message || 'Could not record supply' });
    } finally {
      setSubmitting(false);
    }
  }

  function handleInstallmentSaved(updated) {
    setActivities((current) => current.map((row) => (row.id === updated.id ? updated : row)));
    suppliersApi.list().then(setSuppliers).catch(() => {});
    setPayingActivity(null);
    setToast(
      activityBalance(updated) > 0
        ? `Payment recorded — ${formatCurrency(activityBalance(updated), updated.currency)} remaining`
        : 'Payment recorded — supplier fully paid',
    );
  }

  function openAdd() {
    setForm(emptySupplierForm);
    setErrors({});
    setModalMode('add');
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      name: row.name || '',
      company: row.company || '',
      email: row.email || '',
      phone: sanitizePhoneInput(row.phone || ''),
      address: row.address || '',
    });
    setErrors({});
    setModalMode('edit');
  }

  function openDelete(row) {
    setDeletingSupplier(row);
    setModalMode('delete');
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
    setDeletingSupplier(null);
    setErrors({});
  }

  function openRecord() {
    setActivityForm(emptyActivityForm);
    setActivityErrors({});
    setIsRecordOpen(true);
  }

  function closeRecord() {
    setIsRecordOpen(false);
    setActivityErrors({});
  }

  return (
    <main className="dashboard-shell">
      <DashboardSidebar brand={{ title: 'Jubba group', subtitle: 'ERP System' }} items={sidebarItems} />

      <section className="dashboard-main">
        <DashboardTopbar />

        <div className="dashboard-content suppliers-content">
          {toast ? (
            <div className="toast toast--success" role="status" aria-live="polite">
              <CheckCircleIcon />
              <span>{toast}</span>
            </div>
          ) : null}

          <div className="dashboard-heading">
            <h1>Suppliers Management</h1>
            <p>Track suppliers and their supply activities</p>
          </div>

          <div className="suppliers-tabs" role="tablist" aria-label="Suppliers sections">
            {tabOptions.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`suppliers-tab${activeTab === tab.id ? ' suppliers-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <section className="card suppliers-card">
            <div className="suppliers-card__header">
              <h2>{activeTab === 'suppliers' ? 'All Suppliers' : 'Supply Activities'}</h2>
              <button
                type="button"
                className="suppliers-action-button"
                onClick={activeTab === 'suppliers' ? openAdd : openRecord}
              >
                <PlusIcon />
                {activeTab === 'suppliers' ? 'Add Supplier' : 'Record Supply'}
              </button>
            </div>

            {loadError ? <p className="auth-error">{loadError}</p> : null}
            {loading ? (
              <p>Loading…</p>
            ) : activeTab === 'suppliers' ? (
              <SuppliersTable rows={suppliers} onEdit={openEdit} onDelete={openDelete} />
            ) : (
              <SupplyActivitiesTable rows={activities} onPay={setPayingActivity} onViewAttachment={openAttachment} />
            )}
          </section>
        </div>

        {(isAddOpen || isEditOpen) ? (
          <SupplierFormModal
            title={isEditOpen ? 'Edit Supplier' : 'Add New Supplier'}
            submitLabel={isEditOpen ? 'Update Supplier' : 'Add Supplier'}
            form={form}
            errors={errors}
            onChange={handleFieldChange}
            onCancel={closeModal}
            onSubmit={isEditOpen ? handleUpdate : handleSubmit}
            submitting={submitting}
          />
        ) : null}

        {modalMode === 'delete' && deletingSupplier ? (
          <DeleteSupplierDialog
            supplier={deletingSupplier}
            onCancel={closeModal}
            onDelete={handleDelete}
            submitting={submitting}
          />
        ) : null}

        {payingActivity ? (
          <SupplierPaymentModal
            activity={payingActivity}
            onCancel={() => setPayingActivity(null)}
            onSaved={handleInstallmentSaved}
          />
        ) : null}

        {isRecordOpen ? (
          <RecordSupplyModal
            form={activityForm}
            errors={activityErrors}
            suppliers={suppliers}
            onChange={handleActivityChange}
            onFileChange={activityFile.onFileChange}
            onFileClear={activityFile.onFileClear}
            onCancel={closeRecord}
            onSubmit={handleRecordSubmit}
            submitting={submitting}
          />
        ) : null}
      </section>
    </main>
  );
}

function SupplierFormModal({ title, submitLabel, form, errors = {}, onChange, onCancel, onSubmit, submitting }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="client-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="client-modal__header">
          <h2 id="supplier-modal-title">{title}</h2>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <form className="client-form" onSubmit={onSubmit} noValidate>
          <label className="client-field">
            <span>Supplier Name<span className="client-field__required">*</span></span>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              type="text"
              placeholder="Enter supplier name"
              aria-invalid={Boolean(errors.name)}
              className={errors.name ? 'field-input--invalid' : ''}
            />
            {errors.name ? <span className="field-error">{errors.name}</span> : null}
          </label>

          <label className="client-field">
            <span>Company<span className="client-field__required">*</span></span>
            <input
              name="company"
              value={form.company}
              onChange={onChange}
              type="text"
              placeholder="Enter company name"
              aria-invalid={Boolean(errors.company)}
              className={errors.company ? 'field-input--invalid' : ''}
            />
            {errors.company ? <span className="field-error">{errors.company}</span> : null}
          </label>

          <label className="client-field">
            <span>Email<span className="client-field__required">*</span></span>
            <input
              name="email"
              value={form.email}
              onChange={onChange}
              type="email"
              placeholder="Enter email"
              aria-invalid={Boolean(errors.email)}
              className={errors.email ? 'field-input--invalid' : ''}
            />
            {errors.email ? <span className="field-error">{errors.email}</span> : null}
          </label>

          <label className="client-field">
            <span>Phone<span className="client-field__required">*</span></span>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="\d{10}"
              placeholder="10-digit phone number"
              aria-invalid={Boolean(errors.phone)}
              className={errors.phone ? 'field-input--invalid' : ''}
            />
            {errors.phone ? <span className="field-error">{errors.phone}</span> : null}
          </label>

          <label className="client-field">
            <span>Address</span>
            <input
              name="address"
              value={form.address}
              onChange={onChange}
              type="text"
              placeholder="Enter address"
            />
          </label>

          {errors.form ? <span className="field-error">{errors.form}</span> : null}

          <div className="client-form__actions">
            <button type="button" className="modal-text-button" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="modal-primary-button" disabled={submitting}>
              {submitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DeleteSupplierDialog({ supplier, onCancel, onDelete, submitting }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="client-modal client-modal--delete"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-supplier-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="client-modal__header">
          <h2 id="delete-supplier-title">Delete Supplier</h2>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <div className="delete-dialog">
          <div className="delete-dialog__message">
            <div className="delete-dialog__icon">
              <TrashIcon />
            </div>
            <p>
              Are you sure you want to delete {supplier.name}? This action cannot be undone.
            </p>
          </div>
          <div className="client-form__actions">
            <button type="button" className="modal-text-button" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="button" className="modal-delete-button" onClick={onDelete} disabled={submitting}>
              {submitting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function RecordSupplyModal({ form, errors = {}, suppliers, onChange, onFileChange, onFileClear, onCancel, onSubmit, submitting }) {
  const quantity = Number(form.quantity) || 0;
  const pricePerUnit = Number(form.pricePerUnit) || 0;
  const total = quantity * pricePerUnit;
  const paid = Number(form.amountPaid) || 0;
  const remaining = Math.max(0, total - paid);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="client-modal client-modal--supply"
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-supply-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="client-modal__header">
          <h2 id="record-supply-title">Record Supply Activity</h2>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <form className="client-form" onSubmit={onSubmit} noValidate>
          <label className="client-field">
            <span>Supplier<span className="client-field__required">*</span></span>
            <select
              name="supplier"
              value={form.supplier}
              onChange={onChange}
              aria-invalid={Boolean(errors.supplier)}
              className={errors.supplier ? 'field-input--invalid' : ''}
            >
              <option value="" disabled></option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            {errors.supplier ? <span className="field-error">{errors.supplier}</span> : null}
          </label>

          <label className="client-field">
            <span>Item<span className="client-field__required">*</span></span>
            <input
              name="item"
              type="text"
              value={form.item}
              onChange={onChange}
              placeholder="e.g. Cement bags"
              aria-invalid={Boolean(errors.item)}
              className={errors.item ? 'field-input--invalid' : ''}
            />
            {errors.item ? <span className="field-error">{errors.item}</span> : null}
          </label>

          <label className="client-field">
            <span>Quantity<span className="client-field__required">*</span></span>
            <input
              name="quantity"
              type="number"
              min="1"
              step="1"
              placeholder="0"
              value={form.quantity}
              onChange={onChange}
              aria-invalid={Boolean(errors.quantity)}
              className={errors.quantity ? 'field-input--invalid' : ''}
            />
            {errors.quantity ? <span className="field-error">{errors.quantity}</span> : null}
          </label>

          <label className="client-field">
            <span>Price per Unit<span className="client-field__required">*</span></span>
            <input
              name="pricePerUnit"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0"
              value={form.pricePerUnit}
              onChange={onChange}
              aria-invalid={Boolean(errors.pricePerUnit)}
              className={errors.pricePerUnit ? 'field-input--invalid' : ''}
            />
            {errors.pricePerUnit ? <span className="field-error">{errors.pricePerUnit}</span> : null}
          </label>

          <label className="client-field">
            <span>Invoice Number</span>
            <input
              name="invoice"
              type="text"
              placeholder="Enter invoice number"
              value={form.invoice}
              onChange={onChange}
            />
          </label>

          <label className="client-field">
            <span>Currency</span>
            <select name="currency" value={form.currency || baseCurrency()} onChange={onChange}>
              {getCurrencySettings().currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.name}
                </option>
              ))}
            </select>
            <span className="field-hint">Price, total and every payment for this supply are in this currency.</span>
          </label>

          <AttachmentPicker
            label="Attach Supplier Invoice"
            prompt="Click to attach the invoice the supplier gave you"
            file={form.attachment}
            error={errors.attachment}
            onFileChange={onFileChange}
            onFileClear={onFileClear}
            disabled={submitting}
          />

          <label className="client-field">
            <span>Date<span className="client-field__required">*</span></span>
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

          <div className="record-total">
            <span>Total Amount:</span>
            <strong>{formatCurrency(total, form.currency || baseCurrency())}</strong>
          </div>

          <label className="client-field">
            <span>Amount Paid Now</span>
            <input
              name="amountPaid"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={form.amountPaid}
              onChange={onChange}
              aria-invalid={Boolean(errors.amountPaid)}
              className={errors.amountPaid ? 'field-input--invalid' : ''}
            />
            {errors.amountPaid ? <span className="field-error">{errors.amountPaid}</span> : null}
          </label>

          <div className={`record-total record-total--${remaining > 0 ? 'due' : 'clear'}`}>
            <span>Remaining Balance:</span>
            <strong>{formatCurrency(remaining, form.currency || baseCurrency())}</strong>
          </div>

          {remaining > 0 ? (
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
              <span className="field-hint">You will be notified 3 days before this date and if it passes unpaid.</span>
            </label>
          ) : null}

          {errors.form ? <span className="field-error">{errors.form}</span> : null}

          <div className="client-form__actions">
            <button type="button" className="modal-text-button" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="modal-primary-button" disabled={submitting}>
              {submitting ? 'Saving…' : 'Record Supply'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SuppliersTable({ rows, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="suppliers-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Company</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Activities</th>
            <th>Outstanding</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan="8">No suppliers yet.</td></tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td className="suppliers-table__name">
                  <strong>{row.name}</strong>
                </td>
                <td>{row.company}</td>
                <td className="suppliers-muted">{row.email}</td>
                <td className="suppliers-muted">{row.phone}</td>
                <td className="suppliers-muted">{row.address}</td>
                <td>
                  <div className="suppliers-activity-summary">
                    <strong>{row.activities ?? 0} supplies</strong>
                    <span>{formatCurrency(row.total ?? 0)} total ({baseCurrency()})</span>
                  </div>
                </td>
                <td>
                  <strong className={row.outstanding > 0 ? 'suppliers-owed' : 'suppliers-muted'}>
                    {formatCurrency(row.outstanding ?? 0)} <span className="suppliers-muted">{baseCurrency()}</span>
                  </strong>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="pill-action pill-action--edit"
                      onClick={() => onEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="pill-action pill-action--delete"
                      onClick={() => onDelete(row)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function SupplyActivitiesTable({ rows, onPay, onViewAttachment }) {
  return (
    <div className="table-wrap">
      <table className="suppliers-table suppliers-table--activities">
        <thead>
          <tr>
            <th>Date</th>
            <th>Supplier</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Remaining</th>
            <th>Next Payment</th>
            <th>Status</th>
            <th>Invoice #</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan="11">No supply activities yet.</td></tr>
          ) : (
            rows.map((row) => {
              const balance = activityBalance(row);
              const status = row.paymentStatus || (balance > 0 ? 'pending' : 'paid');
              return (
                <tr key={row.id}>
                  <td className="suppliers-muted">{formatDate(row.date)}</td>
                  <td className="suppliers-table__name">
                    <strong>{row.supplierName || row.supplier}</strong>
                  </td>
                  <td className="suppliers-muted">{row.item}</td>
                  <td className="suppliers-muted">{row.quantity} × {formatUnitPrice(row.pricePerUnit, row.currency)}</td>
                  <td className="suppliers-total">{formatCurrency(row.totalAmount, row.currency)}</td>
                  <td className="suppliers-muted">{formatCurrency(row.amountPaid || 0, row.currency)}</td>
                  <td className={balance > 0 ? 'suppliers-owed' : 'suppliers-muted'}>{formatCurrency(balance, row.currency)}</td>
                  <td className={status === 'overdue' ? 'suppliers-owed' : 'suppliers-muted'}>
                    {balance > 0 ? formatDate(row.nextPaymentDate) || '—' : '—'}
                  </td>
                  <td>
                    <span className={`pill pill--${status}`}>{PAYMENT_STATUS_LABEL[status] || status}</span>
                  </td>
                  <td className="suppliers-muted">
                    <span className="attachment-inline">
                      {row.invoiceNumber || (row.id || '').toString().slice(-6).toUpperCase()}
                      {row.attachment?.name && onViewAttachment ? (
                        <button
                          type="button"
                          className="attachment-view-button"
                          onClick={() => onViewAttachment(row)}
                          title={`View attached invoice: ${row.attachment.name}`}
                          aria-label={`View attached invoice ${row.attachment.name}`}
                        >
                          <ViewIcon />
                        </button>
                      ) : null}
                    </span>
                  </td>
                  <td>
                    {balance > 0 && onPay ? (
                      <div className="row-actions">
                        <button type="button" className="pill-action pill-action--pay" onClick={() => onPay(row)}>
                          Add Payment
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatUnitPrice(value, currencyCode) {
  return formatMoney(value, currencyCode);
}
