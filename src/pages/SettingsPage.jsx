import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { CheckCircleIcon } from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { settingsTabs } from '../data/settings';
import { can } from '../utils/auth';
import { authApi, settingsApi } from '../api';
import { getStoredUser, setStoredUser } from '../utils/auth';
import { isStrongEnoughPassword, isValidPhone, sanitizePhoneInput } from '../utils/validators';
import {
  inventoryIconSrc,
  settingsCompanyIconSrc,
  taxConfigIconSrc,
  usersRolesShieldIconSrc,
} from '../utils/images';
import { DATE_FORMATS, DEFAULT_CURRENCY_SETTINGS, formatDisplayDate, setCurrencySettings } from '../utils/currency';
import '../styles/dashboard.css';
import '../styles/settings.css';
import '../styles/form-errors.css';

const emptyCompany = { name: '', email: '', phone: '', address: '' };
const emptyTax = { rate: 0, registrationNumber: '' };
const emptyPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
const DEFAULT_CATEGORY = 'Others';

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Computed per render (not at module load) so it reflects the logged-in user.
  const visibleSettingsTabs = settingsTabs.filter(
    (tab) => tab.id === 'account' || can('settings', 'view'),
  );
  const VALID_TABS = new Set(visibleSettingsTabs.map((t) => t.id));
  const initialTab = (() => {
    const params = new URLSearchParams(location.search);
    const candidate = params.get('tab');
    const fallback = VALID_TABS.has('company') ? 'company' : 'account';
    return candidate && VALID_TABS.has(candidate) ? candidate : fallback;
  })();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [company, setCompany] = useState(emptyCompany);
  const [tax, setTax] = useState(emptyTax);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingTax, setSavingTax] = useState(false);
  // Currency & Region: working copy of { base, decimals, dateFormat, currencies[] }.
  const [currencyForm, setCurrencyForm] = useState(DEFAULT_CURRENCY_SETTINGS);
  const [currencyError, setCurrencyError] = useState('');
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [companyErrors, setCompanyErrors] = useState({});

  // Inventory categories: `savedCategories` mirrors the server; `categories` is the
  // working copy. `renames` tracks {from, to} so the backend can relabel items.
  const [savedCategories, setSavedCategories] = useState([DEFAULT_CATEGORY]);
  const [categories, setCategories] = useState([DEFAULT_CATEGORY]);
  const [renames, setRenames] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null); // { original, draft }
  const [categoryError, setCategoryError] = useState('');
  const [savingCategories, setSavingCategories] = useState(false);

  const [profile, setProfile] = useState(() => getStoredUser());
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then(({ user }) => {
        if (cancelled || !user) return;
        setProfile(user);
        setStoredUser(user);
      })
      .catch(() => {
        // soft-fail; topbar already handles 401 redirects
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function selectTab(tabId) {
    setActiveTab(tabId);
    const params = new URLSearchParams(location.search);
    params.set('tab', tabId);
    navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    settingsApi
      .getAll()
      .then((all) => {
        if (cancelled) return;
        const incoming = all.company || {};
        setCompany({
          ...emptyCompany,
          ...incoming,
          phone: sanitizePhoneInput(incoming.phone || ''),
        });
        setTax({ ...emptyTax, ...(all.tax || {}) });
        if (all.currency) setCurrencyForm(all.currency);
        const list = Array.isArray(all.inventory?.categories) && all.inventory.categories.length > 0
          ? all.inventory.categories
          : [DEFAULT_CATEGORY];
        setSavedCategories(list);
        setCategories(list);
        setRenames([]);
      })
      .catch((err) => !cancelled && setLoadError(err.message || 'Failed to load settings'))
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

  function handleCompanyChange(field) {
    return (event) => {
      const raw = event.target.value;
      const nextValue = field === 'phone' ? sanitizePhoneInput(raw) : raw;
      setCompany((current) => ({ ...current, [field]: nextValue }));
      setCompanyErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    };
  }

  function handleTaxChange(field) {
    return (event) =>
      setTax((current) => ({
        ...current,
        [field]: field === 'rate' ? Number(event.target.value) : event.target.value,
      }));
  }

  function validateCompany() {
    const errors = {};
    if (!company.phone) {
      errors.phone = 'Phone is required.';
    } else if (!isValidPhone(company.phone)) {
      errors.phone = 'Phone must be exactly 10 digits.';
    }
    return errors;
  }

  async function saveCompany() {
    const errors = validateCompany();
    if (Object.keys(errors).length > 0) {
      setCompanyErrors(errors);
      return;
    }
    setSavingCompany(true);
    try {
      const updated = await settingsApi.update('company', company);
      const next = updated || {};
      setCompany({
        ...emptyCompany,
        ...next,
        phone: sanitizePhoneInput(next.phone || ''),
      });
      setCompanyErrors({});
      setToast('Company settings saved');
    } catch (err) {
      setLoadError(err.message || 'Could not save company settings');
    } finally {
      setSavingCompany(false);
    }
  }

  async function saveTax() {
    setSavingTax(true);
    try {
      const updated = await settingsApi.update('tax', tax);
      setTax({ ...emptyTax, ...(updated || {}) });
      setToast('Tax settings saved');
    } catch (err) {
      setLoadError(err.message || 'Could not save tax settings');
    } finally {
      setSavingTax(false);
    }
  }

  function updateCurrencyRow(index, field, value) {
    setCurrencyForm((current) => ({
      ...current,
      currencies: current.currencies.map((row, i) => (i === index ? { ...row, [field]: field === 'code' ? value.toUpperCase() : value } : row)),
    }));
    setCurrencyError('');
  }

  function addCurrencyRow() {
    setCurrencyForm((current) => ({ ...current, currencies: [...current.currencies, { code: '', name: '', symbol: '', rate: '' }] }));
  }

  function removeCurrencyRow(index) {
    setCurrencyForm((current) => ({ ...current, currencies: current.currencies.filter((_, i) => i !== index) }));
    setCurrencyError('');
  }

  async function saveCurrency() {
    setSavingCurrency(true);
    setCurrencyError('');
    try {
      const payload = {
        ...currencyForm,
        decimals: Number(currencyForm.decimals),
        currencies: currencyForm.currencies
          .filter((row) => String(row.code || '').trim())
          .map((row) => ({ ...row, rate: Number(row.rate) })),
      };
      const updated = await settingsApi.update('currency', payload);
      setCurrencyForm(updated);
      // Every page re-renders with the new currency and date formats.
      setCurrencySettings(updated);
      setToast('Currency settings saved');
    } catch (err) {
      setCurrencyError(err.message || 'Could not save currency settings');
    } finally {
      setSavingCurrency(false);
    }
  }

  const categoriesDirty =
    renames.length > 0 ||
    categories.length !== savedCategories.length ||
    categories.some((name, idx) => name !== savedCategories[idx]);

  function categoryExists(name, ignore) {
    const key = name.toLowerCase();
    return categories.some((c) => c !== ignore && c.toLowerCase() === key);
  }

  function addCategory() {
    const name = newCategory.trim();
    if (!name) {
      setCategoryError('Enter a category name.');
      return;
    }
    if (categoryExists(name)) {
      setCategoryError(`"${name}" already exists.`);
      return;
    }
    setCategories((current) => [...current, name]);
    setNewCategory('');
    setCategoryError('');
  }

  function removeCategory(name) {
    if (name === DEFAULT_CATEGORY) return;
    setCategories((current) => current.filter((c) => c !== name));
    // Dropping a category that was only just added/renamed needs no rename record.
    setRenames((current) => current.filter((r) => r.to !== name));
    setCategoryError('');
  }

  function startRename(name) {
    if (name === DEFAULT_CATEGORY) return;
    setEditingCategory({ original: name, draft: name });
    setCategoryError('');
  }

  function commitRename() {
    if (!editingCategory) return;
    const { original, draft } = editingCategory;
    const name = draft.trim();
    if (!name) {
      setCategoryError('Category name cannot be empty.');
      return;
    }
    if (name !== original && categoryExists(name, original)) {
      setCategoryError(`"${name}" already exists.`);
      return;
    }
    if (name !== original) {
      setCategories((current) => current.map((c) => (c === original ? name : c)));
      setRenames((current) => {
        // Chain renames so the server maps the *saved* name to the final one.
        const existing = current.find((r) => r.to === original);
        if (existing) {
          return current.map((r) => (r === existing ? { ...r, to: name } : r));
        }
        if (savedCategories.includes(original)) {
          return [...current, { from: original, to: name }];
        }
        return current;
      });
    }
    setEditingCategory(null);
    setCategoryError('');
  }

  async function saveCategories() {
    setSavingCategories(true);
    setCategoryError('');
    try {
      const updated = await settingsApi.update('inventory', { categories, renames });
      const list = Array.isArray(updated?.categories) && updated.categories.length > 0
        ? updated.categories
        : [DEFAULT_CATEGORY];
      setSavedCategories(list);
      setCategories(list);
      setRenames([]);
      setEditingCategory(null);
      setToast('Inventory categories saved');
    } catch (err) {
      setCategoryError(err.message || 'Could not save categories');
    } finally {
      setSavingCategories(false);
    }
  }

  function resetCategories() {
    setCategories(savedCategories);
    setRenames([]);
    setEditingCategory(null);
    setNewCategory('');
    setCategoryError('');
  }

  function handlePasswordChange(field) {
    return (event) => {
      const value = event.target.value;
      setPasswordForm((current) => ({ ...current, [field]: value }));
      setPasswordErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
      if (passwordError) setPasswordError('');
    };
  }

  function validatePasswordForm() {
    const errors = {};
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required.';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (!isStrongEnoughPassword(passwordForm.newPassword, 6)) {
      errors.newPassword = 'New password must be at least 6 characters.';
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      errors.newPassword = 'New password must be different from current password.';
    }
    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    return errors;
  }

  async function savePassword() {
    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setSavingPassword(true);
    setPasswordError('');
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm(emptyPasswordForm);
      setPasswordErrors({});
      setToast('Password updated');
    } catch (err) {
      setPasswordError(err.message || 'Could not update password.');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <DashboardSidebar brand={{ title: 'Jubba group', subtitle: 'ERP System' }} items={sidebarItems} />

      <section className="dashboard-main">
        <DashboardTopbar />

        <div className="dashboard-content settings-content">
          {toast ? (
            <div className="toast toast--success" role="status" aria-live="polite">
              <CheckCircleIcon />
              <span>{toast}</span>
            </div>
          ) : null}

          <div className="dashboard-heading">
            <h1>Settings</h1>
            <p>Configure your system preferences</p>
          </div>

          {loadError ? <p className="auth-error">{loadError}</p> : null}

          <div className="settings-tabs" role="tablist" aria-label="Settings sections">
            {visibleSettingsTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`settings-tab${activeTab === tab.id ? ' settings-tab--active' : ''}`}
                onClick={() => selectTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? <p>Loading…</p> : null}

          {activeTab === 'account' ? (
            <>
              <section className="settings-card">
                <div className="settings-card__header">
                  <div className="settings-card__title">
                    <div className="settings-card__icon">
                      <img src={usersRolesShieldIconSrc} alt="" aria-hidden="true" />
                    </div>
                    <div>
                      <h2>Profile</h2>
                      <p>Your account details</p>
                    </div>
                  </div>
                </div>

                <div className="settings-form settings-form--compact">
                  <Field label="Name" value={profile?.name || ''} readOnly />
                  <Field label="Email" value={profile?.email || ''} readOnly />
                  <Field label="Role" value={profile?.role || ''} readOnly />
                  {profile?.lastLogin ? (
                    <Field
                      label="Last sign-in"
                      value={new Date(profile.lastLogin).toLocaleString()}
                      readOnly
                    />
                  ) : null}
                </div>
              </section>

              <section className="settings-card">
                <div className="settings-card__header">
                  <div className="settings-card__title">
                    <div className="settings-card__icon">
                      <img src={usersRolesShieldIconSrc} alt="" aria-hidden="true" />
                    </div>
                    <div>
                      <h2>Change Password</h2>
                      <p>Update the password used to sign in</p>
                    </div>
                  </div>
                </div>

                <div className="settings-form settings-form--compact">
                  <Field
                    label="Current password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange('currentPassword')}
                    type="password"
                    autoComplete="current-password"
                    error={passwordErrors.currentPassword}
                  />
                  <Field
                    label="New password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange('newPassword')}
                    type="password"
                    autoComplete="new-password"
                    error={passwordErrors.newPassword}
                  />
                  <Field
                    label="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange('confirmPassword')}
                    type="password"
                    autoComplete="new-password"
                    error={passwordErrors.confirmPassword}
                  />
                  {passwordError ? <p className="auth-error">{passwordError}</p> : null}
                  <button
                    type="button"
                    className="settings-primary-button"
                    onClick={savePassword}
                    disabled={savingPassword}
                  >
                    {savingPassword ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </section>
            </>
          ) : null}

          {activeTab === 'company' ? (
            <section className="settings-card">
              <div className="settings-card__header">
                <div className="settings-card__title">
                  <div className="settings-card__icon">
                    <img src={settingsCompanyIconSrc} alt="" aria-hidden="true" />
                  </div>
                  <div>
                    <h2>Company Information</h2>
                    <p>Update your company details</p>
                  </div>
                </div>
              </div>

              <div className="settings-form">
                <Field label="Company Name" value={company.name} onChange={handleCompanyChange('name')} />
                <Field label="Email" value={company.email} onChange={handleCompanyChange('email')} type="email" />
                <Field
                  label="Phone"
                  value={company.phone}
                  onChange={handleCompanyChange('phone')}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="\d{10}"
                  placeholder="10-digit phone number"
                  error={companyErrors.phone}
                />
                <Field label="Address" value={company.address} onChange={handleCompanyChange('address')} />
                {can('settings', 'edit') ? (
                <button type="button" className="settings-primary-button" onClick={saveCompany} disabled={savingCompany}>
                  {savingCompany ? 'Saving…' : 'Save Changes'}
                </button>
                ) : null}
              </div>
            </section>
          ) : null}

          {activeTab === 'inventory' ? (
            <section className="settings-card">
              <div className="settings-card__header">
                <div className="settings-card__title">
                  <div className="settings-card__icon">
                    <img src={inventoryIconSrc} alt="" aria-hidden="true" />
                  </div>
                  <div>
                    <h2>Inventory Categories</h2>
                    <p>Categories offered when adding or editing an inventory item</p>
                  </div>
                </div>
              </div>

              <div className="settings-form settings-form--compact">
                {can('settings', 'edit') ? (
                  <div className="category-add">
                    <input
                      type="text"
                      value={newCategory}
                      placeholder="New category name"
                      maxLength={40}
                      onChange={(event) => {
                        setNewCategory(event.target.value);
                        if (categoryError) setCategoryError('');
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addCategory();
                        }
                      }}
                    />
                    <button type="button" className="settings-primary-button" onClick={addCategory}>
                      Add Category
                    </button>
                  </div>
                ) : null}

                <ul className="category-list" aria-label="Inventory categories">
                  {categories.map((name) => {
                    const isDefault = name === DEFAULT_CATEGORY;
                    const isEditing = editingCategory?.original === name;
                    return (
                      <li key={name} className="category-row">
                        {isEditing ? (
                          <input
                            type="text"
                            className="category-row__input"
                            value={editingCategory.draft}
                            maxLength={40}
                            autoFocus
                            onChange={(event) =>
                              setEditingCategory((current) => ({ ...current, draft: event.target.value }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                commitRename();
                              } else if (event.key === 'Escape') {
                                setEditingCategory(null);
                                setCategoryError('');
                              }
                            }}
                          />
                        ) : (
                          <span className="category-row__name">
                            {name}
                            {isDefault ? <em className="category-row__badge">default</em> : null}
                          </span>
                        )}

                        {can('settings', 'edit') && !isDefault ? (
                          <div className="category-row__actions">
                            {isEditing ? (
                              <>
                                <button type="button" className="category-row__button" onClick={commitRename}>
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="category-row__button"
                                  onClick={() => {
                                    setEditingCategory(null);
                                    setCategoryError('');
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" className="category-row__button" onClick={() => startRename(name)}>
                                  Rename
                                </button>
                                <button
                                  type="button"
                                  className="category-row__button category-row__button--danger"
                                  onClick={() => removeCategory(name)}
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>

                {categoryError ? <p className="auth-error">{categoryError}</p> : null}

                {can('settings', 'edit') ? (
                  <div className="category-actions">
                    <button
                      type="button"
                      className="settings-primary-button"
                      onClick={saveCategories}
                      disabled={savingCategories || !categoriesDirty}
                    >
                      {savingCategories ? 'Saving…' : 'Save Changes'}
                    </button>
                    {categoriesDirty ? (
                      <button type="button" className="category-row__button" onClick={resetCategories} disabled={savingCategories}>
                        Discard
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {activeTab === 'currency' ? (
            <section className="settings-card">
              <div className="settings-card__header">
                <div className="settings-card__title">
                  <div className="settings-card__icon">
                    <img src={taxConfigIconSrc} alt="" aria-hidden="true" />
                  </div>
                  <div>
                    <h2>Currency &amp; Region</h2>
                    <p>Currencies you bill in, their exchange rates, and how money and dates are shown</p>
                  </div>
                </div>
              </div>

              <div className="settings-form">
                <div className="currency-settings__row">
                  <label className="settings-field">
                    <span>Base Currency</span>
                    <select
                      value={currencyForm.base}
                      onChange={(event) => setCurrencyForm((current) => ({ ...current, base: event.target.value }))}
                      disabled={!can('settings', 'edit')}
                    >
                      {currencyForm.currencies.filter((row) => row.code).map((row) => (
                        <option key={row.code} value={row.code}>
                          {row.code} · {row.name}
                        </option>
                      ))}
                    </select>
                    <span className="field-hint">Books, dashboard and report totals are kept in this currency. It cannot change once invoices, payments or supplies exist.</span>
                  </label>
                  <label className="settings-field">
                    <span>Decimals</span>
                    <select
                      value={currencyForm.decimals}
                      onChange={(event) => setCurrencyForm((current) => ({ ...current, decimals: Number(event.target.value) }))}
                      disabled={!can('settings', 'edit')}
                    >
                      {[0, 1, 2, 3].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="settings-field">
                    <span>Date Format</span>
                    <select
                      value={currencyForm.dateFormat}
                      onChange={(event) => setCurrencyForm((current) => ({ ...current, dateFormat: event.target.value }))}
                      disabled={!can('settings', 'edit')}
                    >
                      {DATE_FORMATS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="currency-settings__table">
                  <div className="currency-settings__head">
                    <span>Code</span>
                    <span>Name</span>
                    <span>Symbol</span>
                    <span>Rate (per 1 {currencyForm.base})</span>
                    <span />
                  </div>
                  {currencyForm.currencies.map((row, index) => {
                    const isBase = row.code === currencyForm.base;
                    return (
                      <div className="currency-settings__line" key={index}>
                        <input
                          value={row.code}
                          maxLength={3}
                          placeholder="EUR"
                          onChange={(event) => updateCurrencyRow(index, 'code', event.target.value)}
                          disabled={!can('settings', 'edit') || isBase}
                          aria-label="Currency code"
                        />
                        <input
                          value={row.name}
                          placeholder="Euro"
                          onChange={(event) => updateCurrencyRow(index, 'name', event.target.value)}
                          disabled={!can('settings', 'edit')}
                          aria-label="Currency name"
                        />
                        <input
                          value={row.symbol}
                          placeholder="€"
                          onChange={(event) => updateCurrencyRow(index, 'symbol', event.target.value)}
                          disabled={!can('settings', 'edit')}
                          aria-label="Currency symbol"
                        />
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={isBase ? 1 : row.rate}
                          onChange={(event) => updateCurrencyRow(index, 'rate', event.target.value)}
                          disabled={!can('settings', 'edit') || isBase}
                          aria-label="Exchange rate"
                        />
                        {can('settings', 'edit') && !isBase ? (
                          <button type="button" className="currency-settings__remove" onClick={() => removeCurrencyRow(index)}>
                            Remove
                          </button>
                        ) : (
                          <span className="currency-settings__base">{isBase ? 'Base' : ''}</span>
                        )}
                      </div>
                    );
                  })}
                  {can('settings', 'edit') ? (
                    <button type="button" className="currency-settings__add" onClick={addCurrencyRow}>
                      + Add currency
                    </button>
                  ) : null}
                </div>

                <p className="currency-settings__note">
                  Rate = how many units of that currency equal 1 {currencyForm.base}. New invoices and supplies save the rate in use, so changing a rate later never changes old records.
                </p>
                <p className="currency-settings__note">
                  Preview: today is {formatDisplayDate(new Date())} in your current format.
                </p>

                {currencyError ? <span className="field-error">{currencyError}</span> : null}
                {can('settings', 'edit') ? (
                  <button type="button" className="settings-primary-button" onClick={saveCurrency} disabled={savingCurrency}>
                    {savingCurrency ? 'Saving…' : 'Save Changes'}
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          {activeTab === 'tax' ? (
            <section className="settings-card">
              <div className="settings-card__header">
                <div className="settings-card__title">
                  <div className="settings-card__icon">
                    <img src={taxConfigIconSrc} alt="" aria-hidden="true" />
                  </div>
                  <div>
                    <h2>Tax Configuration</h2>
                    <p>Manage tax rates and settings</p>
                  </div>
                </div>
              </div>

              <div className="settings-form settings-form--compact">
                <Field label="Default Tax Rate (%)" value={String(tax.rate ?? 0)} onChange={handleTaxChange('rate')} />
                <Field label="Tax Registration Number" value={tax.registrationNumber || ''} onChange={handleTaxChange('registrationNumber')} />
                {can('settings', 'edit') ? (
                <button type="button" className="settings-primary-button" onClick={saveTax} disabled={savingTax}>
                  {savingTax ? 'Saving…' : 'Save Changes'}
                </button>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, error, ...inputProps }) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <input
        {...inputProps}
        value={value || ''}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        className={error ? 'field-input--invalid' : ''}
      />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
