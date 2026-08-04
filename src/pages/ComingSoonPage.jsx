import React from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { sidebarItems } from '../data/dashboard';
import '../styles/dashboard.css';

export default function ComingSoonPage({ title }) {
  return (
    <main className="dashboard-shell">
      <DashboardSidebar brand={{ title: 'Jubba group', subtitle: 'ERP System' }} items={sidebarItems} />

      <section className="dashboard-main">
        <DashboardTopbar />

        <div className="dashboard-content">
          <div className="dashboard-breadcrumb">
            <span>🏠</span>
            <span>›</span>
            <span>{title}</span>
          </div>

          <div className="dashboard-heading">
            <h1>{title}</h1>
          </div>

          <article className="card placeholder-card">
            <h2>Coming Soon</h2>
            <p>
              The <strong>{title}</strong> module is not part of the current milestone. It will be available in an
              upcoming release.
            </p>
            <div className="placeholder-actions">
              <Link to="/dashboard" className="placeholder-button">
                Go to Dashboard
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
