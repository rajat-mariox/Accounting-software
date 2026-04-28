import React, { useMemo, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { CloseIcon, TrashIcon } from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { invoiceCatalog, invoiceClients, invoiceRows } from '../data/invoices';
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
  invoiceFloatingPlusIconSrc,
  invoiceDetailUserIconSrc,
  invoiceDetailCalendarIconSrc,
  invoiceDeleteTrashIconSrc,
} from '../utils/images';
import '../styles/dashboard.css';
import '../styles/invoices.css';
import '../styles/form-errors.css';

const createDefaults = {
  clientId: invoiceClients[1]?.id ?? '',
  createdDate: '2026-04-16',
  dueDate: '2026-04-30',
  itemId: invoiceCatalog[0]?.id ?? '',
  quantity: '1',
};

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
  return errors;
}

export default function InvoicesPage({ initialAction }) {
  const [invoices, setInvoices] = useState(invoiceRows);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [isModalOpen, setIsModalOpen] = useState(initialAction === 'add');
  const [modalMode, setModalMode] = useState(initialAction === 'add' ? 'create' : null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [createForm, setCreateForm] = useState(createDefaults);
  const [draftItems, setDraftItems] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createErrors, setCreateErrors] = useState({});
  const [addItemError, setAddItemError] = useState('');

  const filteredInvoices = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) {
      return invoices;
    }

    return invoices.filter((invoice) =>
      [invoice.id, invoice.client, invoice.createdDate, invoice.dueDate, invoice.status]
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

  const draftSubtotal = useMemo(
    () => draftItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [draftItems],
  );
  const draftTax = draftSubtotal * 0.1;
  const draftTotal = draftSubtotal + draftTax;

  function openCreateModal() {
    setModalMode('create');
    setSelectedInvoice(null);
    setCreateForm(createDefaults);
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

  function handleCreateInvoice() {
    const validationErrors = validateInvoiceForm(createForm, draftItems);
    if (Object.keys(validationErrors).length > 0) {
      setCreateErrors(validationErrors);
      if (validationErrors.items) {
        setAddItemError(validationErrors.items);
      }
      return;
    }

    const client = invoiceClients.find((item) => item.id === createForm.clientId) ?? invoiceClients[0];
    const subtotal = draftItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const id = `INV-${Date.now()}`;

    const nextInvoice = {
      id,
      client: client?.name ?? 'New Client',
      createdDate: createForm.createdDate,
      dueDate: createForm.dueDate,
      amount: total,
      status: 'pending',
      tone: 'pending',
      items: draftItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    setInvoices((current) => [nextInvoice, ...current]);
    closeModal();
  }

  function handleDeleteInvoice() {
    if (!deleteTarget) {
      return;
    }

    setInvoices((current) => current.filter((invoice) => invoice.id !== deleteTarget.id));
    closeModal();
  }

  function handleCreateFieldChange(event) {
    const { name, value } = event.target;
    setCreateForm((current) => ({ ...current, [name]: value }));
    setCreateErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function handleAddDraftItem() {
    const item = invoiceCatalog.find((entry) => entry.id === createForm.itemId);
    if (!item) {
      setAddItemError('Select an item from the catalog.');
      return;
    }

    if (!isPositiveInteger(createForm.quantity)) {
      setAddItemError('Quantity must be a whole number greater than 0.');
      return;
    }

    const quantity = Number(createForm.quantity);
    setDraftItems((current) => [
      ...current,
      {
        id: `${item.id}-${Date.now()}`,
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
      ? `Invoice ${selectedInvoice.id}`
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

            <button type="button" className="invoice-create-button" onClick={openCreateModal}>
              <img src={invoicePlusIconSrc} alt="" aria-hidden="true" className="invoice-create-button__icon" />
              Create Invoice
            </button>
          </div>

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
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="invoice-id">{invoice.id}</td>
                      <td>{invoice.client}</td>
                      <td>{invoice.createdDate}</td>
                      <td>{invoice.dueDate}</td>
                      <td className="invoice-amount">{formatInvoiceMoney(invoice.amount)}</td>
                      <td>
                        <span className={`invoice-pill invoice-pill--${invoice.tone}`}>{invoice.status}</span>
                      </td>
                      <td>
                        <div className="invoice-actions">
                          <button type="button" className="invoice-icon-action" aria-label={`Download ${invoice.id}`}>
                            <img src={invoiceDownloadIconSrc} alt="" aria-hidden="true" />
                          </button>
                          <button type="button" className="invoice-view-button" onClick={() => openViewModal(invoice)}>
                            View
                          </button>
                          <button type="button" className="invoice-delete-button" onClick={() => openDeleteModal(invoice)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <button type="button" className="invoice-floating-button" onClick={openCreateModal}>
          <img
            src={invoiceFloatingPlusIconSrc}
            alt=""
            aria-hidden="true"
            className="invoice-floating-button__icon"
          />
          Create Invoice
        </button>
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
                        {invoiceClients.map((client) => (
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
                        {invoiceCatalog.map((item) => (
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

                    <div className="invoice-totals">
                      <div>
                        <span>Subtotal:</span>
                        <strong>{formatInvoiceMoney(draftSubtotal)}</strong>
                      </div>
                      <div>
                        <span>Tax (10%):</span>
                        <strong>{formatInvoiceMoney(draftTax)}</strong>
                      </div>
                      <div className="invoice-totals__total">
                        <span>Total:</span>
                        <strong>{formatInvoiceMoney(draftTotal)}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="invoice-empty-add">
                    <img src={invoiceEmptyPlusIconSrc} alt="" aria-hidden="true" />
                    <p>Add items to this invoice</p>
                  </div>
                )}

                <div className="invoice-modal__footer">
                  <button type="button" className="modal-text-button" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="modal-primary-button invoice-modal__primary"
                    disabled={!draftItems.length}
                    onClick={handleCreateInvoice}
                  >
                    Create Invoice
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
                      {selectedInvoice.client}
                    </div>
                  </div>
                  <div className="invoice-detail__field">
                    <span>Status</span>
                    <div className="invoice-detail__value">
                      <span className={`invoice-pill invoice-pill--${selectedInvoice.tone}`}>
                        {selectedInvoice.status}
                      </span>
                    </div>
                  </div>
                  <div className="invoice-detail__field">
                    <span>Created Date</span>
                    <div className="invoice-detail__value">
                      <img src={invoiceDetailCalendarIconSrc} alt="" aria-hidden="true" />
                      {selectedInvoice.createdDate}
                    </div>
                  </div>
                  <div className="invoice-detail__field">
                    <span>Due Date</span>
                    <div className="invoice-detail__value">
                      <img src={invoiceDetailCalendarIconSrc} alt="" aria-hidden="true" />
                      {selectedInvoice.dueDate}
                    </div>
                  </div>
                </div>

                <div className="invoice-detail__items-section">
                  <h3 className="invoice-detail__items-title">Items</h3>
                  <div className="invoice-detail__items">
                    {selectedInvoice.items.map((item) => (
                      <div key={`${selectedInvoice.id}-${item.name}`} className="invoice-detail__item">
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
                  <div>
                    <span>Subtotal:</span>
                    <strong>{formatInvoiceMoney(selectedInvoice.amount / 1.1)}</strong>
                  </div>
                  <div>
                    <span>Tax:</span>
                    <strong>{formatInvoiceMoney(selectedInvoice.amount - selectedInvoice.amount / 1.1)}</strong>
                  </div>
                  <div className="invoice-detail__total">
                    <span>Total:</span>
                    <strong>{formatInvoiceMoney(selectedInvoice.amount)}</strong>
                  </div>
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
                    Are you sure you want to delete invoice {deleteTarget.id}? This action cannot be undone.
                  </p>
                </div>
                <div className="invoice-modal__footer">
                  <button type="button" className="modal-text-button" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="button" className="invoice-delete-confirm" onClick={handleDeleteInvoice}>
                    Delete
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
  }).format(value);
}
