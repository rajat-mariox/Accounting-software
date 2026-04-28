import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import AlertBanner from '../components/dashboard/AlertBanner';
import QuickActions from '../components/dashboard/QuickActions';
import StatCard from '../components/dashboard/StatCard';
import { formatCurrency } from '../utils/formatters';
import {
  alerts as seedAlerts,
  monthlyRevenue,
  pendingPayments,
  quickActions,
  recentActivity,
  salesVsPurchase,
  sidebarItems,
  lowStockAlerts,
  metrics,
} from '../data/dashboard';
import '../styles/dashboard.css';

const alertPaths = {
  'Low Stock Alert': '/inventory',
  'Overdue Invoices': '/invoices',
};

const quickActionPaths = {
  'Add Client': '/clients/add',
  'Add Item': '/items/add',
  'New Invoice': '/invoices/add',
  'Record Payment': '/payments/add',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(seedAlerts);

  const dismissAlert = (title) => {
    setAlerts((prev) => prev.filter((alert) => alert.title !== title));
  };

  const linkedQuickActions = quickActions.map((action) => ({
    ...action,
    onClick: quickActionPaths[action.label]
      ? () => navigate(quickActionPaths[action.label])
      : undefined,
  }));

  return (
    <main className="dashboard-shell">
      <DashboardSidebar brand={{ title: 'Jubba group', subtitle: 'ERP System' }} items={sidebarItems} />

      <section className="dashboard-main">
        <DashboardTopbar />

        <div className="dashboard-content">
          <div className="dashboard-breadcrumb">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3.2 4 9.2V20h5v-6h6v6h5V9.2l-8-6Z" fill="currentColor" />
            </svg>
            <span className="sep">/</span>
            <span>Dashboard</span>
          </div>
          <div className="dashboard-heading">
            <h1>Dashboard</h1>
            <p>Welcome back! Here&apos;s what&apos;s happening today.</p>
          </div>

          {alerts.length > 0 && (
            <div className="dashboard-alerts">
              {alerts.map((alert) => (
                <AlertBanner
                  key={alert.title}
                  {...alert}
                  onDismiss={() => dismissAlert(alert.title)}
                  onClick={alertPaths[alert.title] ? () => navigate(alertPaths[alert.title]) : undefined}
                />
              ))}
            </div>
          )}

          <QuickActions
            title="Quick Actions"
            subtitle="Common tasks to get you started"
            actions={linkedQuickActions}
          />

          <section className="stat-grid">
            {metrics.map((metric) => (
              <StatCard key={metric.label} {...metric} />
            ))}
          </section>

          <section className="charts-grid">
            <ChartCard title="Sales vs Purchase" subtitle="Jan to Jun comparison" action="View all">
              <SalesPurchaseChart />
            </ChartCard>

            <ChartCard title="Monthly Revenue" subtitle="Revenue growth by month">
              <MonthlyRevenueChart />
            </ChartCard>
          </section>

          <section className="lists-grid">
            <ListCard title="Low Stock Alerts" action="View all">
              {lowStockAlerts.map((item) => (
                <div key={item.name} className="alert-row alert-row--warning">
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.stock}</p>
                  </div>
                  <span className="pill pill--warning">{item.badge}</span>
                </div>
              ))}
            </ListCard>

            <ListCard title="Pending Payments" action="View all">
              {pendingPayments.map((item) => (
                <div key={item.id} className={`alert-row alert-row--${item.tone}`}>
                  <div>
                    <strong>{item.id}</strong>
                    <p>Due {item.dueDate}</p>
                  </div>
                  <div className="payment-meta">
                    <strong>{formatCurrency(item.amount)}</strong>
                    <span className={`pill pill--${item.tone}`}>{item.status}</span>
                  </div>
                </div>
              ))}
            </ListCard>
          </section>

          <section className="activity-card">
            <div className="section-heading">
              <div>
                <h2>Recent Activity</h2>
              </div>
            </div>

            <table className="activity-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((row) => (
                  <tr key={row.invoiceId}>
                    <td>{row.invoiceId}</td>
                    <td>{row.date}</td>
                    <td>{formatCurrency(row.amount)}</td>
                    <td>
                      <span className={`pill pill--${row.status}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </section>
    </main>
  );
}

function ChartCard({ title, subtitle, action, children }) {
  return (
    <article className="card chart-card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {action ? <button className="text-link" type="button">{action}</button> : null}
      </div>
      {children}
    </article>
  );
}

function ListCard({ title, action, children }) {
  return (
    <article className="card list-card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
        </div>
        {action ? <button className="text-link" type="button">{action}</button> : null}
      </div>
      <div className="list-card__body">{children}</div>
    </article>
  );
}

function SalesPurchaseChart() {
  const width = 640;
  const height = 280;
  const padding = 28;
  const salesPoints = createPoints(salesVsPurchase.sales, width, height, padding);
  const purchasePoints = createPoints(salesVsPurchase.purchases, width, height, padding);

  return (
    <div className="chart-wrap">
      <div className="chart-legend">
        <span><i className="legend-dot legend-dot--blue" />Sales</span>
        <span><i className="legend-dot legend-dot--green" />Purchase</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="line-chart" aria-label="Sales versus purchase chart" role="img">
        {renderGridLines(width, height)}
        <path d={buildLinePath(salesPoints)} className="line-chart__path line-chart__path--blue" />
        <path d={buildLinePath(purchasePoints)} className="line-chart__path line-chart__path--green" />
        {salesPoints.map((point, index) => (
          <circle key={`sales-${index}`} cx={point.x} cy={point.y} r="3.8" className="line-chart__dot line-chart__dot--blue" />
        ))}
        {purchasePoints.map((point, index) => (
          <circle key={`purchase-${index}`} cx={point.x} cy={point.y} r="3.8" className="line-chart__dot line-chart__dot--green" />
        ))}
      </svg>
      <div className="chart-labels">
        {salesVsPurchase.labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function MonthlyRevenueChart() {
  const width = 640;
  const height = 280;
  const maxValue = Math.max(...monthlyRevenue.values);
  const chartHeight = height - 40;
  const chartWidth = width - 54;
  const barWidth = chartWidth / monthlyRevenue.values.length - 14;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="bar-chart" aria-label="Monthly revenue chart" role="img">
        {renderGridLines(width, height)}
        {monthlyRevenue.values.map((value, index) => {
          const barHeight = (value / maxValue) * chartHeight;
          const x = 32 + index * ((chartWidth / monthlyRevenue.values.length) + 14);
          const y = height - 28 - barHeight;
          return (
            <g key={monthlyRevenue.labels[index]}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="10" className="bar-chart__bar" />
            </g>
          );
        })}
      </svg>
      <div className="chart-labels chart-labels--bars">
        {monthlyRevenue.labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function renderGridLines(width, height) {
  return (
    <g className="chart-grid" aria-hidden="true">
      {[40, 90, 140, 190, 240].map((y) => (
        <line key={y} x1="28" x2={width - 12} y1={y} y2={y} />
      ))}
    </g>
  );
}

function createPoints(values, width, height, padding) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return values.map((value, index) => {
    const x = padding + (usableWidth * index) / Math.max(values.length - 1, 1);
    const y = padding + (1 - (value - min) / range) * usableHeight;
    return { x, y };
  });
}

function buildLinePath(points) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
}
