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
import '../styles/dashboard.css';
import '../styles/clients.css';
import '../styles/inventory.css';

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

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('items');
  const [items, setItems] = useState(inventoryItems);
  const [warehouses, setWarehouses] = useState(seedWarehouses);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'delete' | 'warehouse-add' | null
  const [editingId, setEditingId] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [warehouseForm, setWarehouseForm] = useState(emptyWarehouseForm);
  const [stockAdjustForm, setStockAdjustForm] = useState(emptyStockAdjustForm);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleWarehouseChange(event) {
    const { name, value } = event.target;
    setWarehouseForm((current) => ({ ...current, [name]: value }));
  }

  function openAddWarehouse() {
    setWarehouseForm(emptyWarehouseForm);
    setModalMode('warehouse-add');
  }

  function handleStockAdjustChange(event) {
    const { name, value } = event.target;
    setStockAdjustForm((current) => ({ ...current, [name]: value }));
  }

  function openStockAdjust() {
    setStockAdjustForm({ ...emptyStockAdjustForm, itemId: items[0]?.id ?? '' });
    setModalMode('stock-adjust');
  }

  function handleStockAdjustSubmit(event) {
    event.preventDefault();
    const qty = Math.max(0, Number(stockAdjustForm.quantity) || 0);
    if (!stockAdjustForm.itemId || qty === 0) {
      closeModal();
      return;
    }
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
    setModalMode(null);
    setToast('Stock adjusted successfully');
  }

  function handleWarehouseSubmit(event) {
    event.preventDefault();
    const slug = `${warehouseForm.name || 'warehouse'}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const next = {
      id: slug,
      name: warehouseForm.name || 'New Warehouse',
      location: warehouseForm.location || '',
      totalItems: 0,
      totalStock: 0,
      capacity: Number(warehouseForm.capacity) || 0,
    };
    setWarehouses((current) => [...current, next]);
    setWarehouseForm(emptyWarehouseForm);
    setModalMode(null);
    setToast('Warehouse added successfully');
  }

  function openAdd() {
    setForm(emptyForm);
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
  }

  function handleSubmit(event) {
    event.preventDefault();
    const price = Number(form.price) || 0;
    const stock = Number(form.stock) || 0;
    const threshold = Number(form.threshold) || 0;
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
      const slug = `${form.name || 'item'}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const next = {
        id: slug,
        name: form.name || 'New Item',
        unit: form.unit || 'piece',
        price,
        stock,
        threshold,
        warehouse: form.warehouse || 'Main Warehouse',
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
            warehouses={warehouses}
            onChange={handleChange}
            onCancel={closeModal}
            onSubmit={handleSubmit}
          />
        ) : null}

        {modalMode === 'warehouse-add' ? (
          <WarehouseFormModal
            form={warehouseForm}
            onChange={handleWarehouseChange}
            onCancel={closeModal}
            onSubmit={handleWarehouseSubmit}
          />
        ) : null}

        {modalMode === 'stock-adjust' ? (
          <AdjustStockModal
            form={stockAdjustForm}
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

function AdjustStockModal({ form, items, onChange, onCancel, onSubmit }) {
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

        <form className="app-modal__form" onSubmit={onSubmit}>
          <div className="app-modal__body">
            <label className="app-modal-field">
              <span>Item</span>
              <select name="itemId" value={form.itemId} onChange={onChange} required>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
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
                min="0"
                placeholder="0"
              />
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

function WarehouseFormModal({ form, onChange, onCancel, onSubmit }) {
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

        <form className="client-form" onSubmit={onSubmit}>
          <label className="client-field">
            <span>Name</span>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              type="text"
              placeholder="Warehouse name"
              required
            />
          </label>

          <label className="client-field">
            <span>Location</span>
            <input
              name="location"
              value={form.location}
              onChange={onChange}
              type="text"
              placeholder="City, State"
            />
          </label>

          <label className="client-field">
            <span>Capacity</span>
            <input
              name="capacity"
              value={form.capacity}
              onChange={onChange}
              type="number"
              min="0"
              placeholder="0"
            />
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

function ItemFormModal({ title, submitLabel, form, warehouses, onChange, onCancel, onSubmit }) {
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

        <form className="app-modal__form" onSubmit={onSubmit}>
          <div className="app-modal__body">
            <label className="app-modal-field">
              <span>Name</span>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                type="text"
                placeholder="Item name"
                required
              />
            </label>

            <label className="app-modal-field">
              <span>Unit</span>
              <input
                name="unit"
                value={form.unit}
                onChange={onChange}
                type="text"
                placeholder="piece"
              />
            </label>

            <label className="app-modal-field">
              <span>Price</span>
              <input
                name="price"
                value={form.price}
                onChange={onChange}
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
              />
            </label>

            <label className="app-modal-field">
              <span>Stock</span>
              <input
                name="stock"
                value={form.stock}
                onChange={onChange}
                type="number"
                min="0"
                placeholder="0"
              />
            </label>

            <label className="app-modal-field">
              <span>Low Stock Threshold</span>
              <input
                name="threshold"
                value={form.threshold}
                onChange={onChange}
                type="number"
                min="0"
                placeholder="10"
              />
            </label>

            <label className="app-modal-field">
              <span>Warehouse</span>
              <select name="warehouse" value={form.warehouse} onChange={onChange}>
                <option value=""></option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.name}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
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
