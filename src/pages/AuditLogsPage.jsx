import React, { useEffect, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { sidebarItems } from '../data/dashboard';
import { auditLogsApi } from '../api';
import { auditFilterIconSrc } from '../utils/images';
import '../styles/dashboard.css';
import '../styles/auditLogs.css';

function formatTimestamp(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    auditLogsApi
      .list({ module: moduleFilter || undefined, action: actionFilter || undefined })
      .then((rows) => !cancelled && setLogs(rows))
      .catch((err) => !cancelled && setLoadError(err.message || 'Failed to load audit logs'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [moduleFilter, actionFilter]);

  return (
    <main className="dashboard-shell">
      <DashboardSidebar brand={{ title: 'Jubba group', subtitle: 'ERP System' }} items={sidebarItems} />

      <section className="dashboard-main">
        <DashboardTopbar />

        <div className="dashboard-content audit-content">
          <div className="audit-header">
            <div className="dashboard-heading">
              <h1>Audit Logs</h1>
              <p>Track all system activities</p>
            </div>

            <button type="button" className="audit-filter-button" onClick={() => setShowFilter((s) => !s)}>
              <img
                src={auditFilterIconSrc}
                alt=""
                aria-hidden="true"
                className="audit-filter-button__icon"
              />
              Filter
            </button>
          </div>

          {showFilter ? (
            <section className="audit-card">
              <div style={{ display: 'flex', gap: 12, padding: '12px 16px' }}>
                <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                  <option value="">All modules</option>
                  <option value="Auth">Auth</option>
                  <option value="Users">Users</option>
                  <option value="Clients">Clients</option>
                  <option value="Suppliers">Suppliers</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Invoices">Invoices</option>
                  <option value="Payments">Payments</option>
                  <option value="Settings">Settings</option>
                </select>
                <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                  <option value="">All actions</option>
                  <option value="Create">Create</option>
                  <option value="Update">Update</option>
                  <option value="Delete">Delete</option>
                  <option value="Login">Login</option>
                </select>
              </div>
            </section>
          ) : null}

          <section className="audit-card">
            <h2 className="audit-card__title">Activity Timeline</h2>

            {loadError ? <p className="auth-error">{loadError}</p> : null}

            <div className="table-wrap">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && logs.length === 0 ? (
                    <tr><td colSpan="5">Loading…</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan="5">No audit log entries.</td></tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <div className="audit-user">
                            <span className="audit-user__avatar">{(log.user || '?').charAt(0).toUpperCase()}</span>
                            <span className="audit-user__name">{log.user}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`audit-pill audit-pill--${log.tone}`}>{log.action}</span>
                        </td>
                        <td>{log.module}</td>
                        <td>{log.details}</td>
                        <td className="audit-timestamp">{formatTimestamp(log.timestamp)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
