import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { CheckCircleIcon } from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { settingsTabs } from '../data/settings';
import { authApi, settingsApi } from '../api';
import { getStoredUser, setStoredUser } from '../utils/auth';
import { isStrongEnoughPassword, isValidPhone, sanitizePhoneInput } from '../utils/validators';
import {
  settingsCompanyIconSrc,
  taxConfigIconSrc,
  usersRolesShieldIconSrc,
} from '../utils/images';
import '../styles/dashboard.css';
import '../styles/settings.css';
import '../styles/form-errors.css';

const emptyCompany = { name: '', email: '', phone: '', address: '' };
const emptyTax = { rate: 0, registrationNumber: '' };
const emptyPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

const VALID_TABS = new Set(settingsTabs.map((t) => t.id));

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = (() => {
    const params = new URLSearchParams(location.search);
    const candidate = params.get('tab');
    return candidate && VALID_TABS.has(candidate) ? candidate : 'company';
  })();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [company, setCompany] = useState(emptyCompany);
  const [tax, setTax] = useState(emptyTax);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingTax, setSavingTax] = useState(false);
  const [companyErrors, setCompanyErrors] = useState({});

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
            {settingsTabs.map((tab) => (
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
                <button type="button" className="settings-primary-button" onClick={saveCompany} disabled={savingCompany}>
                  {savingCompany ? 'Saving…' : 'Save Changes'}
                </button>
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
                <button type="button" className="settings-primary-button" onClick={saveTax} disabled={savingTax}>
                  {savingTax ? 'Saving…' : 'Save Changes'}
                </button>
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
