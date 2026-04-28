import React, { useEffect, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { CheckCircleIcon, CloseIcon, PlusIcon, TrashIcon } from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { inventoryTabs } from '../data/inventory';
import { inventoryApi, warehousesApi, transfersApi } from '../api';
import {
  warehouseIconSrc,
  adjustStockIconSrc,
  transferWhiteIconSrc,
  transferEmptyIconSrc,
} from '../utils/images';
import {
  isNonEmpty,
  isNonNegativeNumber,
  isPositiveInteger,
  isPositiveNumber,
} from '../utils/validators';
import '../styles/dashboard.css';
import '../styles/clients.css';
import '../styles/inventory.css';
import '../styles/form-errors.css';

const emptyForm = {
  name: '',
  unit: 'piece',
  price: '',
  stock: '',
  threshold: '10',
  warehouse: '',
};

const emptyWarehouseForm = {
  name: '',
  location: '',
  capacity: '',
};

const emptyStockAdjustForm = {
  itemId: '',
  type: 'in',
  quantity: '',
};

const emptyTransferForm = {
  item: '',
  from: '',
  to: '',
  qty: '',
  date: '',
};

function validateItemForm(form) {
  const errors = {};
  if (!isNonEmpty(form.name)) errors.name = 'Item name is required.';
  if (!isNonEmpty(form.unit)) errors.unit = 'Unit is required.';
  if (!isPositiveNumber(form.price)) {
    errors.price = 'Price must be greater than 0.';
  }
  if (!isNonNegativeNumber(form.stock)) {
    errors.stock = 'Stock must be 0 or greater.';
  } else if (!Number.isInteger(Number(form.stock))) {
    errors.stock = 'Stock must be a whole number.';
  }
  if (!isNonNegativeNumber(form.threshold)) {
    errors.threshold = 'Threshold must be 0 or greater.';
  } else if (!Number.isInteger(Number(form.threshold))) {
    errors.threshold = 'Threshold must be a whole number.';
  }
  if (!isNonEmpty(form.warehouse)) {
    errors.warehouse = 'Select a warehouse.';
  }
  return errors;
}

function validateWarehouseForm(form) {
  const errors = {};
  if (!isNonEmpty(form.name)) errors.name = 'Warehouse name is required.';
  if (!isNonEmpty(form.location)) errors.location = 'Location is required.';
  if (!isPositiveInteger(form.capacity)) {
    errors.capacity = 'Capacity must be a whole number greater than 0.';
  }
  return errors;
}

function validateStockAdjustForm(form) {
  const errors = {};
  if (!isNonEmpty(form.itemId)) errors.itemId = 'Select an item.';
  if (!isPositiveInteger(form.quantity)) {
    errors.quantity = 'Quantity must be a whole number greater than 0.';
  }
  return errors;
}

function validateTransferForm(form) {
  const errors = {};
  if (!isNonEmpty(form.item)) errors.item = 'Select an item.';
  if (!isNonEmpty(form.from)) errors.from = 'Select source warehouse.';
  if (!isNonEmpty(form.to)) errors.to = 'Select destination warehouse.';
  if (form.from && form.to && form.from === form.to) {
    errors.to = 'Destination must differ from source.';
  }
  if (!isPositiveInteger(form.qty)) {
    errors.qty = 'Quantity must be a whole number greater than 0.';
  }
  return errors;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

export default function InventoryPage({ initialAction }) {
  const [activeTab, setActiveTab] = useState('items');
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalMode, setModalMode] = useState(initialAction === 'add' ? 'add' : null);
  const [editing, setEditing] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [warehouseForm, setWarehouseForm] = useState(emptyWarehouseForm);
  const [stockAdjustForm, setStockAdjustForm] = useState(emptyStockAdjustForm);
  const [transferForm, setTransferForm] = useState(emptyTransferForm);
  const [errors, setErrors] = useState({});
  const [warehouseErrors, setWarehouseErrors] = useState({});
  const [stockErrors, setStockErrors] = useState({});
  const [transferErrors, setTransferErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([inventoryApi.list(), warehousesApi.list(), transfersApi.list()])
      .then(([itemsRows, warehouseRows, transferRows]) => {
        if (cancelled) return;
        setItems(itemsRows);
        setWarehouses(warehouseRows);
        setTransfers(transferRows);
      })
      .catch((err) => !cancelled && setLoadError(err.message || 'Failed to load inventory'))
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

  function handleWarehouseChange(event) {
    const { name, value } = event.target;
    setWarehouseForm((current) => ({ ...current, [name]: value }));
    setWarehouseErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function openAddWarehouse() {
    setWarehouseForm(emptyWarehouseForm);
    setWarehouseErrors({});
    setModalMode('warehouse-add');
  }

  function handleStockAdjustChange(event) {
    const { name, value } = event.target;
    setStockAdjustForm((current) => ({ ...current, [name]: value }));
    setStockErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function handleTransferChange(event) {
    const { name, value } = event.target;
    setTransferForm((current) => ({ ...current, [name]: value }));
    setTransferErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function openStockAdjust() {
    setStockAdjustForm({ ...emptyStockAdjustForm, itemId: items[0]?.id ?? '' });
    setStockErrors({});
    setModalMode('stock-adjust');
  }

  function openTransfer() {
    setTransferForm({
      ...emptyTransferForm,
      item: items[0]?.id ?? '',
      from: warehouses[0]?.name ?? '',
      to: warehouses[1]?.name ?? warehouses[0]?.name ?? '',
    });
    setTransferErrors({});
    setModalMode('transfer-add');
  }

  async function handleStockAdjustSubmit(event) {
    event.preventDefault();
    const validationErrors = validateStockAdjustForm(stockAdjustForm);
    if (Object.keys(validationErrors).length > 0) {
      setStockErrors(validationErrors);
      return;
    }
    const item = items.find((row) => row.id === stockAdjustForm.itemId);
    if (!item) return;
    const qty = Number(stockAdjustForm.quantity);
    const delta = stockAdjustForm.type === 'out' ? -qty : qty;
    const nextStock = Math.max(0, (item.stock || 0) + delta);

    setSubmitting(true);
    try {
      const updated = await inventoryApi.update(item.id, { stock: nextStock });
      setItems((current) => current.map((row) => (row.id === item.id ? updated : row)));
      setStockAdjustForm(emptyStockAdjustForm);
      setStockErrors({});
      setModalMode(null);
      setToast('Stock adjusted successfully');
    } catch (err) {
      setStockErrors({ form: err.message || 'Could not adjust stock' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWarehouseSubmit(event) {
    event.preventDefault();
    const validationErrors = validateWarehouseForm(warehouseForm);
    if (Object.keys(validationErrors).length > 0) {
      setWarehouseErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      const created = await warehousesApi.create({
        name: warehouseForm.name,
        location: warehouseForm.location,
        capacity: Number(warehouseForm.capacity),
      });
      setWarehouses((current) => [...current, { ...created, totalItems: 0, totalStock: 0 }]);
      setWarehouseForm(emptyWarehouseForm);
      setWarehouseErrors({});
      setModalMode(null);
      setToast('Warehouse added successfully');
    } catch (err) {
      setWarehouseErrors({ form: err.message || 'Could not add warehouse' });
    } finally {
      setSubmitting(false);
    }
  }

  function openAdd() {
    setForm({ ...emptyForm, warehouse: warehouses[0]?.id ?? '' });
    setErrors({});
    setEditing(null);
    setModalMode('add');
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      name: row.name || '',
      unit: row.unit || 'piece',
      price: String(row.price ?? ''),
      stock: String(row.stock ?? ''),
      threshold: String(row.lowStockThreshold ?? 10),
      warehouse: row.warehouse || '',
    });
    setErrors({});
    setModalMode('edit');
  }

  function openDelete(row) {
    setDeletingItem(row);
    setModalMode('delete');
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
    setDeletingItem(null);
    setErrors({});
    setWarehouseErrors({});
    setStockErrors({});
    setTransferErrors({});
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateItemForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const payload = {
      name: form.name,
      unit: form.unit,
      price: Number(form.price),
      stock: Number(form.stock),
      lowStockThreshold: Number(form.threshold),
      warehouse: form.warehouse,
    };
    setSubmitting(true);
    try {
      if (modalMode === 'edit' && editing) {
        const updated = await inventoryApi.update(editing.id, payload);
        setItems((current) => current.map((row) => (row.id === editing.id ? updated : row)));
        setToast('Item updated successfully');
      } else {
        const created = await inventoryApi.create(payload);
        setItems((current) => [...current, created]);
        setToast('Item added successfully');
      }
      closeModal();
    } catch (err) {
      setErrors({ form: err.message || 'Could not save item' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransferSubmit(event) {
    event.preventDefault();
    const validationErrors = validateTransferForm(transferForm);
    if (Object.keys(validationErrors).length > 0) {
      setTransferErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      const created = await transfersApi.create({
        item: transferForm.item,
        from: transferForm.from,
        to: transferForm.to,
        qty: Number(transferForm.qty),
        date: transferForm.date || undefined,
      });
      setTransfers((current) => [created, ...current]);
      // refresh items in case stock or warehouse changed
      try {
        const refreshed = await inventoryApi.list();
        setItems(refreshed);
      } catch {
        // ignore
      }
      setTransferForm(emptyTransferForm);
      setTransferErrors({});
      setModalMode(null);
      setToast('Transfer recorded successfully');
    } catch (err) {
      setTransferErrors({ form: err.message || 'Could not record transfer' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingItem) return;
    setSubmitting(true);
    try {
      await inventoryApi.remove(deletingItem.id);
      setItems((current) => current.filter((row) => row.id !== deletingItem.id));
      closeModal();
      setToast('Item deleted successfully');
    } catch (err) {
      setErrors({ form: err.message || 'Could not delete item' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <DashboardSidebar brand={{ title: 'Jubba group', subtitle: 'ERP System' }} items={sidebarItems} />

      <section className="dashboard-main">
        <DashboardTopbar />

        <div className="dashboard-content inventory-content">
          {toast ? (
            <div className="toast toast--success" role="status" aria-live="polite">
              <CheckCircleIcon />
              <span>{toast}</span>
            </div>
          ) : null}

          <div className="dashboard-heading">
            <h1>Inventory Management</h1>
            <p>Track and manage your inventory</p>
          </div>

          <div className="inventory-tabs" role="tablist" aria-label="Inventory sections">
            {inventoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`inventory-tab${activeTab === tab.id ? ' inventory-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <section className="card inventory-card">
            <div className="inventory-card__header">
              <h2>{cardTitle(activeTab)}</h2>
              <button
                type="button"
                className="inventory-action-button"
                onClick={
                  activeTab === 'warehouses'
                    ? openAddWarehouse
                    : activeTab === 'stock'
                      ? openStockAdjust
                      : activeTab === 'transfers'
                        ? openTransfer
                        : openAdd
                }
              >
                {activeTab === 'stock' ? (
                  <img src={adjustStockIconSrc} alt="" className="inventory-action-button__icon" />
                ) : activeTab === 'transfers' ? (
                  <img src={transferWhiteIconSrc} alt="" className="inventory-action-button__icon" />
                ) : (
                  <PlusIcon />
                )}
                {actionLabel(activeTab)}
              </button>
            </div>

            {loadError ? <p className="auth-error">{loadError}</p> : null}
            {loading ? (
              <p>Loading…</p>
            ) : activeTab === 'items' ? (
              <ItemsTable rows={items} onEdit={openEdit} onDelete={openDelete} />
            ) : activeTab === 'warehouses' ? (
              <WarehousesGrid rows={warehouses} />
            ) : activeTab === 'stock' ? (
              <StockTable rows={items} />
            ) : activeTab === 'transfers' ? (
              transfers.length === 0 ? <TransfersEmpty /> : <TransfersTable rows={transfers} />
            ) : null}
          </section>
        </div>

        {(modalMode === 'add' || modalMode === 'edit') ? (
          <ItemFormModal
            title={modalMode === 'edit' ? 'Edit Item' : 'Add New Item'}
            submitLabel={modalMode === 'edit' ? 'Update Item' : 'Add Item'}
            form={form}
            errors={errors}
            warehouses={warehouses}
            onChange={handleChange}
            onCancel={closeModal}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        ) : null}

        {modalMode === 'warehouse-add' ? (
          <WarehouseFormModal
            form={warehouseForm}
            errors={warehouseErrors}
            onChange={handleWarehouseChange}
            onCancel={closeModal}
            onSubmit={handleWarehouseSubmit}
            submitting={submitting}
          />
        ) : null}

        {modalMode === 'stock-adjust' ? (
          <AdjustStockModal
            form={stockAdjustForm}
            errors={stockErrors}
            items={items}
            onChange={handleStockAdjustChange}
            onCancel={closeModal}
            onSubmit={handleStockAdjustSubmit}
            submitting={submitting}
          />
        ) : null}

        {modalMode === 'transfer-add' ? (
          <TransferFormModal
            form={transferForm}
            errors={transferErrors}
            items={items}
            warehouses={warehouses}
            onChange={handleTransferChange}
            onCancel={closeModal}
            onSubmit={handleTransferSubmit}
            submitting={submitting}
          />
        ) : null}

        {modalMode === 'delete' && deletingItem ? (
          <DeleteItemDialog item={deletingItem} onCancel={closeModal} onDelete={handleDelete} submitting={submitting} />
        ) : null}
      </section>
    </main>
  );
}

function cardTitle(tab) {
  if (tab === 'items') return 'All Items';
  if (tab === 'warehouses') return 'All Warehouses';
  if (tab === 'stock') return 'Stock Management';
  return 'Stock Transfers';
}

function TransfersEmpty() {
  return (
    <div className="transfers-empty" role="status">
      <img
        src={transferEmptyIconSrc}
        alt=""
        aria-hidden="true"
        className="transfers-empty__icon"
      />
      <p>No stock transfers yet</p>
    </div>
  );
}

function TransfersTable({ rows }) {
  return (
    <div className="table-wrap">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            <th>From</th>
            <th>To</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{formatDate(row.date)}</td>
              <td className="inventory-name">{row.itemName}</td>
              <td>{row.from}</td>
              <td>{row.to}</td>
              <td>{row.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdjustStockModal({ form, errors = {}, items, onChange, onCancel, onSubmit, submitting }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjust-stock-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="app-modal__header">
          <h2 id="adjust-stock-title">Adjust Stock</h2>
          <button
            type="button"
            className="app-modal__close"
            onClick={onCancel}
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

        <form className="app-modal__form" onSubmit={onSubmit} noValidate>
          <div className="app-modal__body">
            <label className="app-modal-field">
              <span>Item</span>
              <select
                name="itemId"
                value={form.itemId}
                onChange={onChange}
                aria-invalid={Boolean(errors.itemId)}
                className={errors.itemId ? 'field-input--invalid' : ''}
              >
                <option value="" disabled></option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {errors.itemId ? <span className="field-error">{errors.itemId}</span> : null}
            </label>

            <label className="app-modal-field">
              <span>Type</span>
              <select name="type" value={form.type} onChange={onChange}>
                <option value="in">Stock in</option>
                <option value="out">Stock out</option>
              </select>
            </label>

            <label className="app-modal-field">
              <span>Quantity</span>
              <input
                name="quantity"
                value={form.quantity}
                onChange={onChange}
                type="number"
                min="1"
                step="1"
                placeholder="0"
                aria-invalid={Boolean(errors.quantity)}
                className={errors.quantity ? 'field-input--invalid' : ''}
              />
              {errors.quantity ? <span className="field-error">{errors.quantity}</span> : null}
            </label>

            {errors.form ? <span className="field-error">{errors.form}</span> : null}
          </div>

          <div className="app-modal__footer">
            <button type="button" className="app-modal__cancel" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="app-modal__submit app-modal__submit--success" disabled={submitting}>
              {submitting ? 'Saving…' : 'Adjust Stock'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function TransferFormModal({ form, errors = {}, items, warehouses, onChange, onCancel, onSubmit, submitting }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="app-modal__header">
          <h2 id="transfer-modal-title">New Transfer</h2>
          <button type="button" className="app-modal__close" onClick={onCancel} aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <form className="app-modal__form" onSubmit={onSubmit} noValidate>
          <div className="app-modal__body">
            <label className="app-modal-field">
              <span>Item</span>
              <select
                name="item"
                value={form.item}
                onChange={onChange}
                aria-invalid={Boolean(errors.item)}
                className={errors.item ? 'field-input--invalid' : ''}
              >
                <option value="" disabled></option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {errors.item ? <span className="field-error">{errors.item}</span> : null}
            </label>

            <label className="app-modal-field">
              <span>From Warehouse</span>
              <select
                name="from"
                value={form.from}
                onChange={onChange}
                aria-invalid={Boolean(errors.from)}
                className={errors.from ? 'field-input--invalid' : ''}
              >
                <option value="" disabled></option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
              {errors.from ? <span className="field-error">{errors.from}</span> : null}
            </label>

            <label className="app-modal-field">
              <span>To Warehouse</span>
              <select
                name="to"
                value={form.to}
                onChange={onChange}
                aria-invalid={Boolean(errors.to)}
                className={errors.to ? 'field-input--invalid' : ''}
              >
                <option value="" disabled></option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
              {errors.to ? <span className="field-error">{errors.to}</span> : null}
            </label>

            <label className="app-modal-field">
              <span>Quantity</span>
              <input
                name="qty"
                value={form.qty}
                onChange={onChange}
                type="number"
                min="1"
                step="1"
                placeholder="0"
                aria-invalid={Boolean(errors.qty)}
                className={errors.qty ? 'field-input--invalid' : ''}
              />
              {errors.qty ? <span className="field-error">{errors.qty}</span> : null}
            </label>

            <label className="app-modal-field">
              <span>Date</span>
              <input name="date" value={form.date} onChange={onChange} type="date" />
            </label>

            {errors.form ? <span className="field-error">{errors.form}</span> : null}
          </div>

          <div className="app-modal__footer">
            <button type="button" className="app-modal__cancel" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="app-modal__submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Record Transfer'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function StockTable({ rows }) {
  return (
    <div className="table-wrap">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Current Stock</th>
            <th>Warehouse</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isLow = row.statusTone === 'danger';
            return (
              <tr key={row.id}>
                <td className="stock-table__item">{row.name}</td>
                <td className={`stock-table__qty${isLow ? ' stock-table__qty--low' : ''}`}>
                  {row.stock} {row.unit}
                </td>
                <td className="stock-table__warehouse">{row.warehouseName || '-'}</td>
                <td>
                  <span className={`stock-pill ${isLow ? 'stock-pill--low' : 'stock-pill--healthy'}`}>
                    {isLow ? 'Low Stock' : 'Healthy'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function actionLabel(tab) {
  if (tab === 'items') return 'Add Item';
  if (tab === 'warehouses') return 'Add Warehouse';
  if (tab === 'stock') return 'Adjust Stock';
  return 'New Transfer';
}

function WarehousesGrid({ rows }) {
  return (
    <div className="warehouse-grid">
      {rows.map((row) => (
        <article key={row.id} className="warehouse-card">
          <div className="warehouse-card__header">
            <span className="warehouse-card__icon" aria-hidden="true">
              <img src={warehouseIconSrc} alt="" />
            </span>
            <button type="button" className="warehouse-card__plus" aria-label={`Add to ${row.name}`}>
              <PlusIcon />
            </button>
          </div>

          <div className="warehouse-card__body">
            <h3>{row.name}</h3>
            <p>{row.location}</p>

            <dl className="warehouse-card__stats">
              <div>
                <dt>Total Items:</dt>
                <dd>{row.totalItems ?? 0}</dd>
              </div>
              <div>
                <dt>Total Stock:</dt>
                <dd>{row.totalStock ?? 0}</dd>
              </div>
              <div>
                <dt>Capacity:</dt>
                <dd>{row.capacity}</dd>
              </div>
            </dl>
          </div>
        </article>
      ))}
    </div>
  );
}

function WarehouseFormModal({ form, errors = {}, onChange, onCancel, onSubmit, submitting }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="client-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="warehouse-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="client-modal__header">
          <h2 id="warehouse-modal-title">Add New Warehouse</h2>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <form className="client-form" onSubmit={onSubmit} noValidate>
          <label className="client-field">
            <span>Name</span>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              type="text"
              placeholder="Warehouse name"
              aria-invalid={Boolean(errors.name)}
              className={errors.name ? 'field-input--invalid' : ''}
            />
            {errors.name ? <span className="field-error">{errors.name}</span> : null}
          </label>

          <label className="client-field">
            <span>Location</span>
            <input
              name="location"
              value={form.location}
              onChange={onChange}
              type="text"
              placeholder="City, State"
              aria-invalid={Boolean(errors.location)}
              className={errors.location ? 'field-input--invalid' : ''}
            />
            {errors.location ? <span className="field-error">{errors.location}</span> : null}
          </label>

          <label className="client-field">
            <span>Capacity</span>
            <input
              name="capacity"
              value={form.capacity}
              onChange={onChange}
              type="number"
              min="1"
              step="1"
              placeholder="0"
              aria-invalid={Boolean(errors.capacity)}
              className={errors.capacity ? 'field-input--invalid' : ''}
            />
            {errors.capacity ? <span className="field-error">{errors.capacity}</span> : null}
          </label>

          {errors.form ? <span className="field-error">{errors.form}</span> : null}

          <div className="client-form__actions">
            <button type="button" className="modal-text-button" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="modal-primary-button" disabled={submitting}>
              {submitting ? 'Saving…' : 'Add Warehouse'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ItemsTable({ rows, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Unit</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Warehouse</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan="7">No items yet.</td></tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td className="inventory-name">{row.name}</td>
                <td className="inventory-muted">{row.unit}</td>
                <td>{formatPrice(row.price)}</td>
                <td className={row.statusTone === 'danger' ? 'inventory-low' : ''}>{row.stock}</td>
                <td>{row.warehouseName || '-'}</td>
                <td>
                  <span className={`inventory-pill inventory-pill--${row.statusTone}`}>{row.status}</span>
                </td>
                <td>
                  <div className="row-actions">
                    <button type="button" className="pill-action pill-action--edit" onClick={() => onEdit(row)}>
                      Edit
                    </button>
                    <button type="button" className="pill-action pill-action--delete" onClick={() => onDelete(row)}>
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

function ItemFormModal({ title, submitLabel, form, errors = {}, warehouses, onChange, onCancel, onSubmit, submitting }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="app-modal__header">
          <h2 id="item-modal-title">{title}</h2>
          <button type="button" className="app-modal__close" onClick={onCancel} aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <form className="app-modal__form" onSubmit={onSubmit} noValidate>
          <div className="app-modal__body">
            <label className="app-modal-field">
              <span>Name</span>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                type="text"
                placeholder="Item name"
                aria-invalid={Boolean(errors.name)}
                className={errors.name ? 'field-input--invalid' : ''}
              />
              {errors.name ? <span className="field-error">{errors.name}</span> : null}
            </label>

            <label className="app-modal-field">
              <span>Unit</span>
              <input
                name="unit"
                value={form.unit}
                onChange={onChange}
                type="text"
                placeholder="piece"
                aria-invalid={Boolean(errors.unit)}
                className={errors.unit ? 'field-input--invalid' : ''}
              />
              {errors.unit ? <span className="field-error">{errors.unit}</span> : null}
            </label>

            <label className="app-modal-field">
              <span>Price</span>
              <input
                name="price"
                value={form.price}
                onChange={onChange}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0"
                aria-invalid={Boolean(errors.price)}
                className={errors.price ? 'field-input--invalid' : ''}
              />
              {errors.price ? <span className="field-error">{errors.price}</span> : null}
            </label>

            <label className="app-modal-field">
              <span>Stock</span>
              <input
                name="stock"
                value={form.stock}
                onChange={onChange}
                type="number"
                min="0"
                step="1"
                placeholder="0"
                aria-invalid={Boolean(errors.stock)}
                className={errors.stock ? 'field-input--invalid' : ''}
              />
              {errors.stock ? <span className="field-error">{errors.stock}</span> : null}
            </label>

            <label className="app-modal-field">
              <span>Low Stock Threshold</span>
              <input
                name="threshold"
                value={form.threshold}
                onChange={onChange}
                type="number"
                min="0"
                step="1"
                placeholder="10"
                aria-invalid={Boolean(errors.threshold)}
                className={errors.threshold ? 'field-input--invalid' : ''}
              />
              {errors.threshold ? <span className="field-error">{errors.threshold}</span> : null}
            </label>

            <label className="app-modal-field">
              <span>Warehouse</span>
              <select
                name="warehouse"
                value={form.warehouse}
                onChange={onChange}
                aria-invalid={Boolean(errors.warehouse)}
                className={errors.warehouse ? 'field-input--invalid' : ''}
              >
                <option value=""></option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {errors.warehouse ? <span className="field-error">{errors.warehouse}</span> : null}
            </label>

            {errors.form ? <span className="field-error">{errors.form}</span> : null}
          </div>

          <div className="app-modal__footer">
            <button type="button" className="app-modal__cancel" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="app-modal__submit" disabled={submitting}>
              {submitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DeleteItemDialog({ item, onCancel, onDelete, submitting }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="client-modal client-modal--delete"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-item-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="client-modal__header">
          <h2 id="delete-item-title">Delete Item</h2>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <div className="delete-dialog">
          <div className="delete-dialog__message">
            <div className="delete-dialog__icon">
              <TrashIcon />
            </div>
            <p>Are you sure you want to delete {item.name}? This action cannot be undone.</p>
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

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value >= 1000 ? 0 : 0,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(value);
}
