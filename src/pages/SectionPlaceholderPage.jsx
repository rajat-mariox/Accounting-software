import React from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { sidebarItems } from '../data/dashboard';
import '../styles/dashboard.css';

export default function SectionPlaceholderPage({ title, description, activePath }) {
  const items = sidebarItems.map((item) => ({
    ...item,
    end: item.end,
    path: item.path,
  }));

  return (
    <main className="dashboard-shell">
      <DashboardSidebar brand={{ title: 'Jubba group', subtitle: 'ERP System' }} items={items} />

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
            <p>{description}</p>
          </div>

          <article className="card placeholder-card">
            <h2>This section is ready for implementation</h2>
            <p>
              The routing is now active for <strong>{activePath}</strong>. We can build this screen next with the same
              design system and navigation shell.
            </p>
            <div className="placeholder-actions">
              <Link to="/dashboard" className="placeholder-button">
                Go to Dashboard
              </Link>
              <Link to="/clients" className="placeholder-button placeholder-button--secondary">
                Go to Clients
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
