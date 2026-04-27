import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import {
  BuildingOutlineIcon,
  CheckCircleIcon,
  CloseIcon,
  EditIcon,
  MailOutlineIcon,
  PhoneOutlineIcon,
  PlusIcon,
  PinOutlineIcon,
  SearchIcon,
  TrashIcon,
  UserOutlineIcon,
} from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { clientRows } from '../data/clients';
import { formatCurrency } from '../utils/formatters';
import '../styles/clients.css';
import '../styles/dashboard.css';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
};

export default function ClientsPage() {
  const [clients, setClients] = useState(clientRows);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [selectedClient, setSelectedClient] = useState(clients[0]);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return clients;
    }

    return clients.filter((client) =>
      [client.name, client.company, client.email, client.phone, client.address]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [clients, search]);

  function openAddModal() {
    setForm(emptyForm);
    setModalMode('add');
  }

  function openDetailsModal(client) {
    setSelectedClient(client);
    setModalMode('details');
  }

  function openEditModal(client) {
    setSelectedClient(client);
    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      address: client.address,
    });
    setModalMode('edit');
  }

  function openDeleteModal(client) {
    setSelectedClient(client);
    setModalMode('delete');
  }

  function closeModal() {
    setModalMode(null);
  }

  function showToast(message) {
    setToast(message);
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleAddSubmit(event) {
    event.preventDefault();
    const nextClient = createClientFromForm(form);

    setClients((current) => [nextClient, ...current]);
    setSelectedClient(nextClient);
    setModalMode(null);
    setForm(emptyForm);
    showToast('Client added successfully');
  }

  function handleEditSubmit(event) {
    event.preventDefault();

    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              name: form.name,
              email: form.email,
              phone: form.phone,
              company: form.company,
              address: form.address,
            }
          : client,
      ),
    );

    setSelectedClient((current) => ({
      ...current,
      name: form.name,
      email: form.email,
      phone: form.phone,
      company: form.company,
      address: form.address,
    }));
    setModalMode(null);
    showToast('Client updated successfully');
  }

  function handleDeleteConfirm() {
    setClients((current) => {
      const next = current.filter((client) => client.id !== selectedClient.id);
      setSelectedClient(next[0] ?? null);
      return next;
    });
    setModalMode(null);
    showToast('Client deleted successfully');
  }

  const activeClient = selectedClient ?? filteredClients[0] ?? clients[0];

  return (
    <main className="dashboard-shell">
      <DashboardSidebar brand={{ title: 'Jubba group', subtitle: 'ERP System' }} items={sidebarItems} />

      <section className="dashboard-main">
        <DashboardTopbar />

        <div className="dashboard-content clients-content">
          {toast ? (
            <div className="toast toast--success" role="status" aria-live="polite">
              <CheckCircleIcon />
              <span>{toast}</span>
            </div>
          ) : null}

          <div className="dashboard-breadcrumb">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3.2 4 9.2V20h5v-6h6v6h5V9.2l-8-6Z" fill="currentColor" />
            </svg>
            <span className="sep">/</span>
            <span>Clients</span>
          </div>

          <div className="clients-header">
            <div className="dashboard-heading">
              <h1>Clients</h1>
              <p>Manage your client relationships</p>
            </div>

            <button className="clients-add-button" type="button" onClick={openAddModal}>
              <PlusIcon />
              Add Client
            </button>
          </div>

          <section className="card clients-card">
            <label className="clients-search">
              <SearchIcon />
              <input
                type="search"
                placeholder="Search clients by name, email, or company..."
                aria-label="Search clients"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="clients-table-wrap">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((row) => (
                    <tr key={row.id}>
                      <td className="clients-table__name">
                        <button className="client-name-button" type="button" onClick={() => openDetailsModal(row)}>
                          <strong>{row.name}</strong>
                          <span>{row.address}</span>
                        </button>
                      </td>
                      <td>{row.company}</td>
                      <td>
                        <span className="inline-meta">
                          <MailOutlineIcon />
                          {row.email}
                        </span>
                      </td>
                      <td>
                        <span className="inline-meta">
                          <PhoneOutlineIcon />
                          {row.phone}
                        </span>
                      </td>
                      <td>{row.created}</td>
                      <td>
                        <div className="clients-actions">
                          <button
                            type="button"
                            className="icon-action icon-action--edit"
                            aria-label={`View ${row.name}`}
                            onClick={() => openDetailsModal(row)}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            className="icon-action icon-action--delete"
                            aria-label={`Delete ${row.name}`}
                            onClick={() => openDeleteModal(row)}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {modalMode === 'add' ? (
            <ClientModal onBackdrop={closeModal} title="Add New Client">
              <ClientForm form={form} onChange={handleFieldChange} onCancel={closeModal} onSubmit={handleAddSubmit} />
            </ClientModal>
          ) : null}

          {modalMode === 'edit' ? (
            <ClientModal onBackdrop={closeModal} title="Edit Client">
              <ClientForm
                form={form}
                onChange={handleFieldChange}
                onCancel={closeModal}
                onSubmit={handleEditSubmit}
                submitLabel="Update Client"
              />
            </ClientModal>
          ) : null}

          {modalMode === 'details' ? (
            <ClientModal
              onBackdrop={closeModal}
              title="Client Details"
              widthClass="client-modal--details"
              headerAction={
                <button type="button" className="detail-edit-button" onClick={() => openEditModal(activeClient)}>
                  <EditIcon />
                  Edit
                </button>
              }
            >
              <ClientDetails client={activeClient} />
            </ClientModal>
          ) : null}

          {modalMode === 'delete' ? (
            <ClientModal onBackdrop={closeModal} title="Delete Client" widthClass="client-modal--delete">
              <DeleteClientDialog
                client={activeClient}
                onCancel={closeModal}
                onDelete={handleDeleteConfirm}
              />
            </ClientModal>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function createClientFromForm(form) {
  const slug = `${form.name || 'new-client'}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    id: slug,
    name: form.name || 'New Client',
    address: form.address || 'New Address',
    company: form.company || 'New Company',
    email: form.email || 'client@example.com',
    phone: form.phone || '+1-555-0000',
    created: new Date().toISOString().slice(0, 10),
    invoiceHistory: [],
  };
}

function ClientModal({ title, children, onBackdrop, widthClass = '', headerAction = null }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onBackdrop}>
      <section
        className={`client-modal ${widthClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="client-modal__header">
          <h2 id="client-modal-title">{title}</h2>
          <div className="client-modal__header-actions">
            {headerAction}
            <button type="button" className="modal-close" onClick={onBackdrop} aria-label="Close modal">
              <CloseIcon />
            </button>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}

function ClientForm({ form, onChange, onCancel, onSubmit, submitLabel = 'Add Client' }) {
  return (
    <form className="client-form" onSubmit={onSubmit}>
      <label className="client-field">
        <span>Name</span>
        <input name="name" value={form.name} onChange={onChange} type="text" placeholder="Enter client name" />
      </label>

      <label className="client-field">
        <span>Email</span>
        <input
          name="email"
          value={form.email}
          onChange={onChange}
          type="email"
          placeholder="Enter email address"
        />
      </label>

      <label className="client-field">
        <span>Phone</span>
        <input name="phone" value={form.phone} onChange={onChange} type="tel" placeholder="Enter phone number" />
      </label>

      <label className="client-field">
        <span>Company</span>
        <input
          name="company"
          value={form.company}
          onChange={onChange}
          type="text"
          placeholder="Enter company name"
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
  );
}

function ClientDetails({ client }) {
  const invoice = client.invoiceHistory?.[0];

  return (
    <div className="client-details">
      <div className="client-details__grid">
        <DetailBlock icon={UserOutlineIcon} label="Name" value={client.name} />
        <DetailBlock icon={BuildingOutlineIcon} label="Company" value={client.company} />
        <DetailBlock icon={MailOutlineIcon} label="Email" value={client.email} />
        <DetailBlock icon={PhoneOutlineIcon} label="Phone" value={client.phone} />
        <DetailBlock icon={PinOutlineIcon} label="Address" value={client.address} fullWidth />
      </div>

      <div className="client-details__section">
        <div className="client-details__section-title">Invoice History</div>
        {invoice ? (
          <div className="invoice-history-item">
            <div>
              <strong>{invoice.id}</strong>
              <span>{invoice.date}</span>
            </div>
            <div className="invoice-history-item__meta">
              <strong>{formatCurrency(invoice.amount)}</strong>
              <span className={`pill pill--${invoice.status}`}>{invoice.status}</span>
            </div>
          </div>
        ) : (
          <div className="invoice-history-empty">No invoice history available.</div>
        )}
      </div>
    </div>
  );
}

function DetailBlock({ icon: Icon, label, value, fullWidth = false }) {
  return (
    <div className={`detail-block${fullWidth ? ' detail-block--full' : ''}`}>
      <span>{label}</span>
      <div className="detail-block__value">
        <Icon />
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function DeleteClientDialog({ client, onCancel, onDelete }) {
  return (
    <div className="delete-dialog">
      <div className="delete-dialog__message">
        <div className="delete-dialog__icon">
          <TrashIcon />
        </div>
        <p>
          Are you sure you want to delete {client?.name}? This action cannot be undone.
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
  );
}
