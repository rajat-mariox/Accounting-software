import React, { useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { PlusIcon } from '../components/dashboard/icons';
import { sidebarItems } from '../data/dashboard';
import { companySettings, settingsTabs, taxSettings, userRoles } from '../data/settings';
import { settingsCompanyIconSrc, taxConfigIconSrc, userRoleIconSrc } from '../utils/images';
import '../styles/dashboard.css';
import '../styles/settings.css';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');

  return (
    <main className="dashboard-shell">
      <DashboardSidebar brand={{ title: 'Jubba group', subtitle: 'ERP System' }} items={sidebarItems} />

      <section className="dashboard-main">
        <DashboardTopbar />

        <div className="dashboard-content settings-content">
          <div className="dashboard-heading">
            <h1>Settings</h1>
            <p>Configure your system preferences</p>
          </div>

          <div className="settings-tabs" role="tablist" aria-label="Settings sections">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`settings-tab${activeTab === tab.id ? ' settings-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

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
                <Field label="Company Name" value={companySettings.name} />
                <Field label="Email" value={companySettings.email} />
                <Field label="Phone" value={companySettings.phone} />
                <Field label="Address" value={companySettings.address} />
                <button type="button" className="settings-primary-button">
                  Save Changes
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
                <Field label="Default Tax Rate (%)" value={String(taxSettings.rate)} />
                <Field label="Tax Registration Number" value={taxSettings.registrationNumber} />
                <button type="button" className="settings-primary-button">
                  Save Changes
                </button>
              </div>
            </section>
          ) : null}

          {activeTab === 'users' ? (
            <section className="settings-card">
              <div className="settings-card__header settings-card__header--split">
                <div className="settings-card__title">
                  <div className="settings-card__icon">
                    <img src={userRoleIconSrc} alt="" aria-hidden="true" />
                  </div>
                  <div>
                    <h2>Users &amp; Roles</h2>
                    <p>Manage user access and permissions</p>
                  </div>
                </div>

                <button type="button" className="settings-add-button">
                  <PlusIcon />
                  Add User
                </button>
              </div>

              <div className="settings-users">
                {userRoles.map((user) => (
                  <div key={user.email} className="settings-user-row">
                    <div className="settings-user-row__meta">
                      <div className="settings-user-row__avatar">{user.initials}</div>
                      <div>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                    <span className="settings-user-row__role">{user.role}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Field({ label, value }) {
  const [current, setCurrent] = useState(value);
  return (
    <label className="settings-field">
      <span>{label}</span>
      <input value={current} onChange={(event) => setCurrent(event.target.value)} />
    </label>
  );
}
