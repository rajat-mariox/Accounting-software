import React, { useMemo, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import {
  CloseIcon,
  EditIcon,
  EyeOffIcon,
  TrashIcon,
  ViewIcon,
} from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { userRoleCount, userRows } from '../data/users';
import {
  isNonEmpty,
  isStrongEnoughPassword,
  isValidEmail,
  isValidPhone,
  sanitizePhoneInput,
} from '../utils/validators';
import {
  usersTotalIconSrc,
  usersActiveIconSrc,
  usersInactiveIconSrc,
  usersRolesShieldIconSrc,
  usersAddIconSrc,
  usersMailIconSrc,
  usersPhoneIconSrc,
  usersCalendarIconSrc,
  usersModalChevronIconSrc,
  usersModalBulletIconSrc,
} from '../utils/images';
import '../styles/dashboard.css';
import '../styles/users.css';
import '../styles/form-errors.css';

const roleOptions = [
  { value: 'Administrator', tone: 'admin' },
  { value: 'Manager', tone: 'manager' },
  { value: 'Accountant', tone: 'accountant' },
];

const statusOptions = ['Active', 'Inactive'];

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: '',
  status: '',
};

const permissionsList = ['View Records', 'Basic Operations', 'Limited Access'];

function validateUserForm(form, mode, existingUsers, currentUserId) {
  const errors = {};
  if (!isNonEmpty(form.name)) {
    errors.name = 'Full name is required.';
  } else if (form.name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  }
  if (!isNonEmpty(form.email)) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(form.email)) {
    errors.email = 'Enter a valid email address.';
  } else {
    const trimmed = form.email.trim().toLowerCase();
    const taken = existingUsers.some(
      (user) => user.email.toLowerCase() === trimmed && user.id !== currentUserId,
    );
    if (taken) errors.email = 'A user with this email already exists.';
  }
  if (mode === 'add') {
    if (!isNonEmpty(form.password)) {
      errors.password = 'Password is required.';
    } else if (!isStrongEnoughPassword(form.password, 6)) {
      errors.password = 'Password must be at least 6 characters.';
    }
  } else if (isNonEmpty(form.password) && !isStrongEnoughPassword(form.password, 6)) {
    errors.password = 'Password must be at least 6 characters.';
  }
  if (!isNonEmpty(form.phone)) {
    errors.phone = 'Phone is required.';
  } else if (!isValidPhone(form.phone)) {
    errors.phone = 'Phone must be exactly 10 digits.';
  }
  if (!isNonEmpty(form.role)) errors.role = 'Select a role.';
  if (!isNonEmpty(form.status)) errors.status = 'Select a status.';
  return errors;
}

function buildInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function UsersRolesPage() {
  const [users, setUsers] = useState(userRows);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'delete' | null
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const stats = useMemo(() => {
    const activeCount = users.filter((user) => user.status === 'active').length;
    const inactiveCount = users.length - activeCount;
    return [
      { label: 'Total Users', value: users.length, tone: 'blue', iconSrc: usersTotalIconSrc },
      { label: 'Active Users', value: activeCount, tone: 'green', iconSrc: usersActiveIconSrc },
      { label: 'Inactive Users', value: inactiveCount, tone: 'red', iconSrc: usersInactiveIconSrc },
      { label: 'Roles', value: userRoleCount, tone: 'amber', iconSrc: usersRolesShieldIconSrc },
    ];
  }, [users]);

  function openAddModal() {
    setForm(emptyForm);
    setErrors({});
    setSelectedUser(null);
    setShowPassword(false);
    setModalMode('add');
  }

  function openEditModal(user) {
    setSelectedUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      phone: sanitizePhoneInput(user.phone),
      role: user.role,
      status: capitalize(user.status),
    });
    setErrors({});
    setShowPassword(false);
    setModalMode('edit');
  }

  function openDeleteModal(user) {
    setSelectedUser(user);
    setModalMode('delete');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
    setErrors({});
  }

  function handleChange(event) {
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

  function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateUserForm(form, modalMode, users, selectedUser?.id);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const roleMatch = roleOptions.find((option) => option.value === form.role);

    if (modalMode === 'edit' && selectedUser) {
      setUsers((current) =>
        current.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                name: form.name,
                initials: buildInitials(form.name),
                email: form.email,
                phone: form.phone || user.phone,
                role: form.role,
                roleTone: roleMatch?.tone ?? user.roleTone,
                status: form.status.toLowerCase(),
              }
            : user,
        ),
      );
      closeModal();
      return;
    }

    const newUser = {
      id: `u${users.length + 1}`,
      initials: buildInitials(form.name),
      name: form.name,
      email: form.email,
      phone: form.phone || '+1-555-0000',
      role: form.role,
      roleTone: roleMatch?.tone ?? 'manager',
      status: form.status.toLowerCase(),
      lastLogin: 'Never',
    };

    setUsers((current) => [...current, newUser]);
    closeModal();
  }

  function handleDeleteConfirm() {
    if (!selectedUser) return;
    setUsers((current) => current.filter((user) => user.id !== selectedUser.id));
    closeModal();
  }

  return (
    <main className="dashboard-shell">
      <DashboardSidebar brand={{ title: 'Jubba group', subtitle: 'ERP System' }} items={sidebarItems} />

      <section className="dashboard-main">
        <DashboardTopbar />

        <div className="dashboard-content">
          <div className="users-header">
            <div className="dashboard-heading">
              <h1>Users &amp; Roles</h1>
              <p>Manage user access and permissions</p>
            </div>

            <button type="button" className="users-add-button" onClick={openAddModal}>
              <img src={usersAddIconSrc} alt="" aria-hidden="true" />
              Add User
            </button>
          </div>

          <section className="users-stats">
            {stats.map((stat) => (
              <article key={stat.label} className="users-stat-card">
                <div className={`users-stat-card__icon users-stat-card__icon--${stat.tone}`}>
                  <img src={stat.iconSrc} alt="" aria-hidden="true" />
                </div>
                <div className="users-stat-card__text">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              </article>
            ))}
          </section>

          <section className="users-list-card">
            <h2 className="users-list-card__title">All Users</h2>

            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="users-table__name-cell">
                        <span className="users-avatar">{user.initials}</span>
                        <div className="users-table__name">
                          <strong>{user.name}</strong>
                          <p>ID: {user.id}</p>
                        </div>
                      </td>
                      <td>
                        <span className="users-table__inline">
                          <img src={usersMailIconSrc} alt="" aria-hidden="true" />
                          {user.email}
                        </span>
                      </td>
                      <td>
                        <span className="users-table__inline">
                          <img src={usersPhoneIconSrc} alt="" aria-hidden="true" />
                          {user.phone}
                        </span>
                      </td>
                      <td>
                        <span className={`users-pill users-pill--${user.roleTone}`}>{user.role}</span>
                      </td>
                      <td>
                        <span className={`users-pill users-pill--status-${user.status}`}>{user.status}</span>
                      </td>
                      <td>
                        <span className="users-table__inline">
                          <img src={usersCalendarIconSrc} alt="" aria-hidden="true" />
                          {user.lastLogin}
                        </span>
                      </td>
                      <td>
                        <div className="users-actions">
                          <button
                            type="button"
                            className="users-action-btn users-action-btn--edit"
                            aria-label={`Edit ${user.name}`}
                            onClick={() => openEditModal(user)}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            className="users-action-btn users-action-btn--delete"
                            aria-label={`Delete ${user.name}`}
                            onClick={() => openDeleteModal(user)}
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

          {modalMode === 'add' || modalMode === 'edit' ? (
            <div className="users-modal-backdrop" role="presentation" onClick={closeModal}>
              <section
                className="users-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="users-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="users-modal__header">
                  <h2 id="users-modal-title">{modalMode === 'edit' ? 'Edit User' : 'Add New User'}</h2>
                  <button
                    type="button"
                    className="users-modal__close"
                    onClick={closeModal}
                    aria-label="Close dialog"
                  >
                    <CloseIcon />
                  </button>
                </header>

                <form className="users-modal__body" onSubmit={handleSubmit} noValidate>
                  <div className="users-form-field">
                    <label htmlFor="users-form-name">
                      Full Name<span className="users-form-required">*</span>
                    </label>
                    <input
                      id="users-form-name"
                      name="name"
                      type="text"
                      placeholder="Enter full name"
                      value={form.name}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.name)}
                      className={errors.name ? 'field-input--invalid' : ''}
                    />
                    {errors.name ? <span className="field-error">{errors.name}</span> : null}
                  </div>

                  <div className="users-form-field">
                    <label htmlFor="users-form-email">
                      Email<span className="users-form-required">*</span>
                    </label>
                    <input
                      id="users-form-email"
                      name="email"
                      type="email"
                      placeholder="user@example.com"
                      value={form.email}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.email)}
                      className={errors.email ? 'field-input--invalid' : ''}
                    />
                    {errors.email ? <span className="field-error">{errors.email}</span> : null}
                  </div>

                  <div className="users-form-field">
                    <label htmlFor="users-form-password">
                      Password
                      {modalMode === 'add' ? <span className="users-form-required">*</span> : null}
                    </label>
                    <div className="users-form-password">
                      <input
                        id="users-form-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : 'Enter password'}
                        value={form.password}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.password)}
                        className={errors.password ? 'field-input--invalid' : ''}
                      />
                      <button
                        type="button"
                        className="users-form-password__toggle"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOffIcon /> : <ViewIcon />}
                      </button>
                    </div>
                    {errors.password ? <span className="field-error">{errors.password}</span> : null}
                  </div>

                  <div className="users-form-field">
                    <label htmlFor="users-form-phone">
                      Phone<span className="users-form-required">*</span>
                    </label>
                    <input
                      id="users-form-phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="\d{10}"
                      placeholder="10-digit phone number"
                      value={form.phone}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.phone)}
                      className={errors.phone ? 'field-input--invalid' : ''}
                    />
                    {errors.phone ? <span className="field-error">{errors.phone}</span> : null}
                  </div>

                  <div className="users-form-field">
                    <label htmlFor="users-form-role">
                      Role<span className="users-form-required">*</span>
                    </label>
                    <div className="users-form-select">
                      <select
                        id="users-form-role"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.role)}
                        className={errors.role ? 'field-input--invalid' : ''}
                      >
                        <option value="" disabled hidden></option>
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.value}
                          </option>
                        ))}
                      </select>
                      <img
                        src={usersModalChevronIconSrc}
                        alt=""
                        aria-hidden="true"
                        className="users-form-select__chevron"
                      />
                    </div>
                    {errors.role ? <span className="field-error">{errors.role}</span> : null}
                  </div>

                  <div className="users-form-field">
                    <label htmlFor="users-form-status">
                      Status<span className="users-form-required">*</span>
                    </label>
                    <div className="users-form-select">
                      <select
                        id="users-form-status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.status)}
                        className={errors.status ? 'field-input--invalid' : ''}
                      >
                        <option value="" disabled hidden></option>
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <img
                        src={usersModalChevronIconSrc}
                        alt=""
                        aria-hidden="true"
                        className="users-form-select__chevron"
                      />
                    </div>
                    {errors.status ? <span className="field-error">{errors.status}</span> : null}
                  </div>

                  <div className="users-permissions">
                    <strong>Role Permissions:</strong>
                    <ul>
                      {permissionsList.map((permission) => (
                        <li key={permission}>
                          <img src={usersModalBulletIconSrc} alt="" aria-hidden="true" />
                          {permission}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="users-modal__actions">
                    <button type="button" className="users-modal__cancel" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="submit" className="users-modal__submit">
                      {modalMode === 'edit' ? 'Update User' : 'Add User'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          ) : null}

          {modalMode === 'delete' && selectedUser ? (
            <div className="users-modal-backdrop" role="presentation" onClick={closeModal}>
              <section
                className="users-modal users-modal--delete"
                role="dialog"
                aria-modal="true"
                aria-labelledby="users-delete-title"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="users-modal__header">
                  <h2 id="users-delete-title">Delete User</h2>
                  <button
                    type="button"
                    className="users-modal__close"
                    onClick={closeModal}
                    aria-label="Close dialog"
                  >
                    <CloseIcon />
                  </button>
                </header>

                <div className="users-modal__body">
                  <p className="users-delete-message">
                    Are you sure you want to delete <strong>{selectedUser.name}</strong>? This action cannot be undone.
                  </p>

                  <div className="users-modal__actions">
                    <button type="button" className="users-modal__cancel" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="button" className="users-modal__submit users-modal__submit--danger" onClick={handleDeleteConfirm}>
                      Delete
                    </button>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
