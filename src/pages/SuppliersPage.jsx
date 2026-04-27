import React, { useEffect, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { CheckCircleIcon, CloseIcon, PlusIcon, TrashIcon } from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { supplierRows as seedSuppliers, supplyActivityRows as seedActivities } from '../data/suppliers';
import { inventoryItems } from '../data/inventory';
import { formatCurrency } from '../utils/formatters';
import '../styles/dashboard.css';
import '../styles/clients.css';
import '../styles/suppliers.css';

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
};

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState(seedSuppliers);
  const [activities, setActivities] = useState(seedActivities);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'delete' | null
  const [editingId, setEditingId] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [form, setForm] = useState(emptySupplierForm);
  const [activityForm, setActivityForm] = useState(emptyActivityForm);
  const [toast, setToast] = useState(null);

  const isAddOpen = modalMode === 'add';
  const isEditOpen = modalMode === 'edit';

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleActivityChange(event) {
    const { name, value } = event.target;
    setActivityForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const slug = `${form.name || 'supplier'}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const next = {
      id: slug,
      name: form.name || 'New Supplier',
      company: form.company || form.name || 'New Company',
      email: form.email || '',
      phone: form.phone || '',
      address: form.address || '',
      activities: 0,
      total: 0,
    };

    setSuppliers((current) => [next, ...current]);
    setForm(emptySupplierForm);
    setModalMode(null);
    setToast('Supplier added successfully');
  }

  function handleUpdate(event) {
    event.preventDefault();
    setSuppliers((current) =>
      current.map((row) =>
        row.id === editingId
          ? {
              ...row,
              name: form.name,
              company: form.company,
              email: form.email,
              phone: form.phone,
              address: form.address,
            }
          : row,
      ),
    );
    setForm(emptySupplierForm);
    setEditingId(null);
    setModalMode(null);
    setToast('Supplier updated successfully');
  }

  function handleDelete() {
    if (!deletingSupplier) return;
    setSuppliers((current) => current.filter((row) => row.id !== deletingSupplier.id));
    setDeletingSupplier(null);
    setModalMode(null);
    setToast('Supplier deleted successfully');
  }

  function handleRecordSubmit(event) {
    event.preventDefault();
    const quantity = Number(activityForm.quantity) || 0;
    const pricePerUnit = Number(activityForm.pricePerUnit) || 0;
    const totalAmount = quantity * pricePerUnit;
    const slug = `sup-${Date.now()}`.toLowerCase();

    const next = {
      id: activityForm.invoice ? activityForm.invoice.toLowerCase() : slug,
      date: activityForm.date,
      supplier: activityForm.supplier,
      item: activityForm.item,
      quantity,
      pricePerUnit,
      totalAmount,
    };

    setActivities((current) => [next, ...current]);
    setActivityForm(emptyActivityForm);
    setIsRecordOpen(false);
    setToast('Supply activity recorded successfully');
  }

  function openAdd() {
    setForm(emptySupplierForm);
    setModalMode('add');
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      company: row.company,
      email: row.email,
      phone: row.phone,
      address: row.address,
    });
    setModalMode('edit');
  }

  function openDelete(row) {
    setDeletingSupplier(row);
    setModalMode('delete');
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
    setDeletingSupplier(null);
  }

  function openRecord() {
    setActivityForm(emptyActivityForm);
    setIsRecordOpen(true);
  }

  function closeRecord() {
    setIsRecordOpen(false);
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

            {activeTab === 'suppliers' ? (
              <SuppliersTable rows={suppliers} onEdit={openEdit} onDelete={openDelete} />
            ) : (
              <SupplyActivitiesTable rows={activities} />
            )}
          </section>
        </div>

        {(isAddOpen || isEditOpen) ? (
          <SupplierFormModal
            title={isEditOpen ? 'Edit Supplier' : 'Add New Supplier'}
            submitLabel={isEditOpen ? 'Update Supplier' : 'Add Supplier'}
            form={form}
            onChange={handleFieldChange}
            onCancel={closeModal}
            onSubmit={isEditOpen ? handleUpdate : handleSubmit}
          />
        ) : null}

        {modalMode === 'delete' && deletingSupplier ? (
          <DeleteSupplierDialog
            supplier={deletingSupplier}
            onCancel={closeModal}
            onDelete={handleDelete}
          />
        ) : null}

        {isRecordOpen ? (
          <RecordSupplyModal
            form={activityForm}
            suppliers={suppliers}
            items={inventoryItems}
            onChange={handleActivityChange}
            onCancel={closeRecord}
            onSubmit={handleRecordSubmit}
          />
        ) : null}
      </section>
    </main>
  );
}

function SupplierFormModal({ title, submitLabel, form, onChange, onCancel, onSubmit }) {
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

        <form className="client-form" onSubmit={onSubmit}>
          <label className="client-field">
            <span>
              Supplier Name<span className="client-field__required">*</span>
            </span>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              type="text"
              placeholder="Enter supplier name"
              required
            />
          </label>

          <label className="client-field">
            <span>
              Company<span className="client-field__required">*</span>
            </span>
            <input
              name="company"
              value={form.company}
              onChange={onChange}
              type="text"
              placeholder="Enter company name"
              required
            />
          </label>

          <label className="client-field">
            <span>
              Email<span className="client-field__required">*</span>
            </span>
            <input
              name="email"
              value={form.email}
              onChange={onChange}
              type="email"
              placeholder="Enter email"
              required
            />
          </label>

          <label className="client-field">
            <span>Phone</span>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              type="tel"
              placeholder="Enter phone number"
            />
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

          <div className="client-form__actions">
            <button type="button" className="modal-text-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="modal-primary-button">
              {submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DeleteSupplierDialog({ supplier, onCancel, onDelete }) {
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
            <button type="button" className="modal-text-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="modal-delete-button" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function RecordSupplyModal({ form, suppliers, items, onChange, onCancel, onSubmit }) {
  const quantity = Number(form.quantity) || 0;
  const pricePerUnit = Number(form.pricePerUnit) || 0;
  const total = quantity * pricePerUnit;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="client-modal"
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

        <form className="client-form" onSubmit={onSubmit}>
          <label className="client-field">
            <span>
              Supplier<span className="client-field__required">*</span>
            </span>
            <select name="supplier" value={form.supplier} onChange={onChange} required>
              <option value="" disabled></option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.name}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>

          <label className="client-field">
            <span>
              Item<span className="client-field__required">*</span>
            </span>
            <select name="item" value={form.item} onChange={onChange} required>
              <option value="" disabled></option>
              {items.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="client-field">
            <span>
              Quantity<span className="client-field__required">*</span>
            </span>
            <input
              name="quantity"
              type="number"
              min="0"
              placeholder="0"
              value={form.quantity}
              onChange={onChange}
              required
            />
          </label>

          <label className="client-field">
            <span>
              Price per Unit<span className="client-field__required">*</span>
            </span>
            <input
              name="pricePerUnit"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={form.pricePerUnit}
              onChange={onChange}
              required
            />
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
            <span>
              Date<span className="client-field__required">*</span>
            </span>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={onChange}
              required
            />
          </label>

          <div className="record-total">
            <span>Total Amount:</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          <div className="client-form__actions">
            <button type="button" className="modal-text-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="modal-primary-button">
              Record Supply
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
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
                  <strong>{row.activities} supplies</strong>
                  <span>{formatCurrency(row.total)} total</span>
                </div>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SupplyActivitiesTable({ rows }) {
  return (
    <div className="table-wrap">
      <table className="suppliers-table suppliers-table--activities">
        <thead>
          <tr>
            <th>Date</th>
            <th>Supplier</th>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price/Unit</th>
            <th>Total Amount</th>
            <th>Invoice #</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="suppliers-muted">{row.date}</td>
              <td className="suppliers-table__name">
                <strong>{row.supplier}</strong>
              </td>
              <td className="suppliers-muted">{row.item}</td>
              <td className="suppliers-muted">{row.quantity}</td>
              <td className="suppliers-muted">{formatUnitPrice(row.pricePerUnit)}</td>
              <td className="suppliers-total">{formatCurrency(row.totalAmount)}</td>
              <td className="suppliers-muted">{row.id.toUpperCase()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatUnitPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(value);
}
