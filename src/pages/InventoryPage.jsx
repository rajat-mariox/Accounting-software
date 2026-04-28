import React, { useEffect, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { CheckCircleIcon, CloseIcon, PlusIcon, TrashIcon } from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { inventoryItems, inventoryTabs, warehouseRows as seedWarehouses } from '../data/inventory';
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

export default function InventoryPage({ initialAction }) {
  const [activeTab, setActiveTab] = useState('items');
  const [items, setItems] = useState(inventoryItems);
  const [warehouses, setWarehouses] = useState(seedWarehouses);
  const [modalMode, setModalMode] = useState(initialAction === 'add' ? 'add' : null); // 'add' | 'edit' | 'delete' | 'warehouse-add' | null
  const [editingId, setEditingId] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [warehouseForm, setWarehouseForm] = useState(emptyWarehouseForm);
  const [stockAdjustForm, setStockAdjustForm] = useState(emptyStockAdjustForm);
  const [errors, setErrors] = useState({});
  const [warehouseErrors, setWarehouseErrors] = useState({});
  const [stockErrors, setStockErrors] = useState({});
  const [toast, setToast] = useState(null);

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

  function openStockAdjust() {
    setStockAdjustForm({ ...emptyStockAdjustForm, itemId: items[0]?.id ?? '' });
    setStockErrors({});
    setModalMode('stock-adjust');
  }

  function handleStockAdjustSubmit(event) {
    event.preventDefault();
    const validationErrors = validateStockAdjustForm(stockAdjustForm);
    if (Object.keys(validationErrors).length > 0) {
      setStockErrors(validationErrors);
      return;
    }
    const qty = Number(stockAdjustForm.quantity);
    const delta = stockAdjustForm.type === 'out' ? -qty : qty;
    setItems((current) =>
      current.map((row) => {
        if (row.id !== stockAdjustForm.itemId) return row;
        const nextStock = Math.max(0, row.stock + delta);
        const threshold = row.threshold ?? 10;
        const statusTone = nextStock <= threshold ? 'danger' : 'success';
        const status = statusTone === 'danger' ? 'Low Stock' : 'In Stock';
        return { ...row, stock: nextStock, status, statusTone };
      }),
    );
    setStockAdjustForm(emptyStockAdjustForm);
    setStockErrors({});
    setModalMode(null);
    setToast('Stock adjusted successfully');
  }

  function handleWarehouseSubmit(event) {
    event.preventDefault();
    const validationErrors = validateWarehouseForm(warehouseForm);
    if (Object.keys(validationErrors).length > 0) {
      setWarehouseErrors(validationErrors);
      return;
    }
    const slug = `${warehouseForm.name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const next = {
      id: slug,
      name: warehouseForm.name,
      location: warehouseForm.location,
      totalItems: 0,
      totalStock: 0,
      capacity: Number(warehouseForm.capacity),
    };
    setWarehouses((current) => [...current, next]);
    setWarehouseForm(emptyWarehouseForm);
    setWarehouseErrors({});
    setModalMode(null);
    setToast('Warehouse added successfully');
  }

  function openAdd() {
    setForm(emptyForm);
    setErrors({});
    setEditingId(null);
    setModalMode('add');
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      unit: row.unit,
      price: String(row.price),
      stock: String(row.stock),
      threshold: String(row.threshold ?? 10),
      warehouse: row.warehouse,
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
    setEditingId(null);
    setDeletingItem(null);
    setErrors({});
    setWarehouseErrors({});
    setStockErrors({});
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateItemForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const price = Number(form.price);
    const stock = Number(form.stock);
    const threshold = Number(form.threshold);
    const statusTone = stock <= threshold ? 'danger' : 'success';
    const status = statusTone === 'danger' ? 'Low Stock' : 'In Stock';

    if (modalMode === 'edit' && editingId) {
      setItems((current) =>
        current.map((row) =>
          row.id === editingId
            ? {
                ...row,
                name: form.name,
                unit: form.unit,
                price,
                stock,
                threshold,
                warehouse: form.warehouse,
                status,
                statusTone,
              }
            : row,
        ),
      );
      setToast('Item updated successfully');
    } else {
      const slug = `${form.name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const next = {
        id: slug,
        name: form.name,
        unit: form.unit,
        price,
        stock,
        threshold,
        warehouse: form.warehouse,
        status,
        statusTone,
      };
      setItems((current) => [...current, next]);
      setToast('Item added successfully');
    }

    closeModal();
  }

  function handleDelete() {
    if (!deletingItem) return;
    setItems((current) => current.filter((row) => row.id !== deletingItem.id));
    closeModal();
    setToast('Item deleted successfully');
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

            {activeTab === 'items' ? (
              <ItemsTable rows={items} onEdit={openEdit} onDelete={openDelete} />
            ) : activeTab === 'warehouses' ? (
              <WarehousesGrid rows={warehouses} />
            ) : activeTab === 'stock' ? (
              <StockTable rows={items} />
            ) : activeTab === 'transfers' ? (
              <TransfersEmpty />
            ) : (
              <EmptyTab label={inventoryTabs.find((tab) => tab.id === activeTab)?.label} />
            )}
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
          />
        ) : null}

        {modalMode === 'warehouse-add' ? (
          <WarehouseFormModal
            form={warehouseForm}
            errors={warehouseErrors}
            onChange={handleWarehouseChange}
            onCancel={closeModal}
            onSubmit={handleWarehouseSubmit}
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
          />
        ) : null}

        {modalMode === 'delete' && deletingItem ? (
          <DeleteItemDialog item={deletingItem} onCancel={closeModal} onDelete={handleDelete} />
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

function AdjustStockModal({ form, errors = {}, items, onChange, onCancel, onSubmit }) {
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
          </div>

          <div className="app-modal__footer">
            <button type="button" className="app-modal__cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="app-modal__submit app-modal__submit--success">
              Adjust Stock
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
                <td className="stock-table__warehouse">{row.warehouse}</td>
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
                <dd>{row.totalItems}</dd>
              </div>
              <div>
                <dt>Total Stock:</dt>
                <dd>{row.totalStock}</dd>
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

function WarehouseFormModal({ form, errors = {}, onChange, onCancel, onSubmit }) {
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

          <div className="client-form__actions">
            <button type="button" className="modal-text-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="modal-primary-button">
              Add Warehouse
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
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="inventory-name">{row.name}</td>
              <td className="inventory-muted">{row.unit}</td>
              <td>{formatPrice(row.price)}</td>
              <td className={row.statusTone === 'danger' ? 'inventory-low' : ''}>{row.stock}</td>
              <td>{row.warehouse}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyTab({ label }) {
  return (
    <div className="inventory-empty">
      <p>The {label} view is not yet built.</p>
    </div>
  );
}

function ItemFormModal({ title, submitLabel, form, errors = {}, warehouses, onChange, onCancel, onSubmit }) {
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
                  <option key={warehouse.id} value={warehouse.name}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {errors.warehouse ? <span className="field-error">{errors.warehouse}</span> : null}
            </label>
          </div>

          <div className="app-modal__footer">
            <button type="button" className="app-modal__cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="app-modal__submit">
              {submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DeleteItemDialog({ item, onCancel, onDelete }) {
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

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value >= 1000 ? 0 : 0,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(value);
}
