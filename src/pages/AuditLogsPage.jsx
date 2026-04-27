
import React from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { sidebarItems } from '../data/dashboard';
import { auditLogs } from '../data/auditLogs';
import { auditFilterIconSrc } from '../utils/images';
import '../styles/dashboard.css';
import '../styles/auditLogs.css';

export default function AuditLogsPage() {
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

            <button type="button" className="audit-filter-button">
              <img
                src={auditFilterIconSrc}
                alt=""
                aria-hidden="true"
                className="audit-filter-button__icon"
              />
              Filter
            </button>
          </div>

          <section className="audit-card">
            <h2 className="audit-card__title">Activity Timeline</h2>

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
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="audit-user">
                          <span className="audit-user__avatar">A</span>
                          <span className="audit-user__name">{log.user}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`audit-pill audit-pill--${log.tone}`}>{log.action}</span>
                      </td>
                      <td>{log.module}</td>
                      <td>{log.details}</td>
                      <td className="audit-timestamp">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
