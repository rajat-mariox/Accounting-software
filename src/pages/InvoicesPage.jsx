import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { CloseIcon, TrashIcon } from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { invoicesApi, clientsApi, inventoryApi } from '../api';
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
import '../styles/dashboard.css';
import '../styles/invoices.css';
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
  const [createForm, setCreateForm] = useState({ clientId: '', createdDate: todayISO(), dueDate: '', itemId: '', quantity: '1' });
  const [draftItems, setDraftItems] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createErrors, setCreateErrors] = useState({});
  const [addItemError, setAddItemError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([invoicesApi.list(), clientsApi.list(), inventoryApi.list()])
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

  const draftSubtotal = useMemo(
    () => draftItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [draftItems],
  );

  function openCreateModal() {
    setModalMode('create');
    setSelectedInvoice(null);
    setCreateForm({
      clientId: clients[0]?.id ?? '',
      createdDate: todayISO(),
      dueDate: '',
      itemId: catalog[0]?.id ?? '',
      quantity: '1',
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
      const created = await invoicesApi.create({
        client: createForm.clientId,
        createdDate: createForm.createdDate,
        dueDate: createForm.dueDate,
        items: draftItems.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
      });
      setInvoices((current) => [created, ...current]);
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
                          <span className={`invoice-pill invoice-pill--${invoice.status}`}>{invoice.status}</span>
                        </td>
                        <td>
                          <div className="invoice-actions">
                            {invoice.status !== 'paid' ? (
                              <button type="button" className="invoice-view-button" onClick={() => markPaid(invoice)}>
                                Mark Paid
                              </button>
                            ) : (
                              <button type="button" className="invoice-icon-action" aria-label={`Download ${invoice.invoiceNumber || invoice.id}`}>
                                <img src={invoiceDownloadIconSrc} alt="" aria-hidden="true" />
                              </button>
                            )}
                            <button type="button" className="invoice-view-button" onClick={() => openViewModal(invoice)}>
                              View
                            </button>
                            <button type="button" className="invoice-delete-button" onClick={() => openDeleteModal(invoice)}>
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

                    <div className="invoice-totals">
                      <div className="invoice-totals__total">
                        <span>Total:</span>
                        <strong>{formatInvoiceMoney(draftSubtotal)}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="invoice-empty-add">
                    <img src={invoiceEmptyPlusIconSrc} alt="" aria-hidden="true" />
                    <p>Add items to this invoice</p>
                  </div>
                )}

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
                        {selectedInvoice.status}
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
