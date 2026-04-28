import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import AlertBanner from '../components/dashboard/AlertBanner';
import QuickActions from '../components/dashboard/QuickActions';
import StatCard from '../components/dashboard/StatCard';
import { formatCurrency } from '../utils/formatters';
import {
  quickActions,
  salesVsPurchase,
  sidebarItems,
} from '../data/dashboard';
import { reportsApi, inventoryApi, invoicesApi } from '../api';
import {
  SalesMetricIcon,
  PurchaseMetricIcon,
  PendingMetricIcon,
  StockMetricIcon,
  WarningIcon,
  InvoiceAlertIcon,
} from '../components/dashboard/icons';
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

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [salesByMonth, setSalesByMonth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([reportsApi.dashboard(), inventoryApi.list(), invoicesApi.list(), reportsApi.sales()])
      .then(([summaryData, itemsData, invoicesData, salesData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setItems(itemsData);
        setInvoices(invoicesData);
        setSalesByMonth(salesData);
      })
      .catch(() => {
        // soft-fail — page renders with partial data
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const lowStockItems = useMemo(
    () => items.filter((item) => item.stock <= (item.lowStockThreshold ?? 10)).slice(0, 5),
    [items],
  );

  const pendingInvoices = useMemo(
    () =>
      invoices
        .filter((inv) => inv.status !== 'paid')
        .slice(0, 5)
        .map((inv) => ({
          id: inv.invoiceNumber || inv.id,
          dueDate: formatDate(inv.dueDate),
          amount: inv.amount,
          status: inv.status,
          tone: inv.status,
        })),
    [invoices],
  );

  const recentInvoices = useMemo(() => {
    const source = summary?.recentInvoices?.length ? summary.recentInvoices : invoices.slice(0, 5);
    return source.map((row) => ({
      invoiceId: row.invoiceNumber || row.id,
      date: formatDate(row.createdDate),
      amount: row.amount,
      status: row.status,
    }));
  }, [summary, invoices]);

  const monthlyRevenueValues = useMemo(() => {
    if (!salesByMonth || salesByMonth.length === 0) return [0];
    return salesByMonth.map((row) => Number(row.total) || 0);
  }, [salesByMonth]);

  const monthlyRevenueLabels = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (!salesByMonth || salesByMonth.length === 0) return ['—'];
    return salesByMonth.map((row) => `${monthNames[row.id.month - 1]} '${String(row.id.year).slice(-2)}`);
  }, [salesByMonth]);

  const computedMetrics = useMemo(() => [
    {
      label: 'Total Revenue',
      value: summary?.totalRevenue ?? 0,
      change: summary ? `${summary.paidInvoices} paid` : '—',
      trend: 'up',
      icon: SalesMetricIcon,
    },
    {
      label: 'Outstanding',
      value: summary?.outstanding ?? 0,
      change: summary ? `${summary.pendingInvoices + summary.overdueInvoices} open` : '—',
      trend: 'neutral',
      icon: PurchaseMetricIcon,
    },
    {
      label: 'Pending Invoices',
      value: summary?.pendingInvoices ?? 0,
      change: summary ? `${summary.overdueInvoices} overdue` : '—',
      trend: 'down',
      icon: PendingMetricIcon,
    },
    {
      label: 'Low Stock Alert',
      value: summary?.lowStockItems ?? 0,
      change: `${summary?.lowStockItems ?? 0} items`,
      trend: 'neutral',
      icon: StockMetricIcon,
    },
  ], [summary]);

  const computedAlerts = useMemo(() => {
    const out = [];
    if ((summary?.lowStockItems ?? 0) > 0 && !dismissed.has('Low Stock Alert')) {
      out.push({
        variant: 'warning',
        icon: WarningIcon,
        title: 'Low Stock Alert',
        description: `${summary.lowStockItems} item(s) are running low on stock. Click to view details.`,
        cta: 'View Items',
      });
    }
    if ((summary?.overdueInvoices ?? 0) > 0 && !dismissed.has('Overdue Invoices')) {
      out.push({
        variant: 'danger',
        icon: InvoiceAlertIcon,
        title: 'Overdue Invoices',
        description: `You have ${summary.overdueInvoices} overdue invoice(s) that need attention.`,
        cta: 'View Invoices',
      });
    }
    return out;
  }, [summary, dismissed]);

  const dismissAlert = (title) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(title);
      return next;
    });
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
            <p>{loading ? 'Loading…' : 'Welcome back! Here’s what’s happening today.'}</p>
          </div>

          {computedAlerts.length > 0 && (
            <div className="dashboard-alerts">
              {computedAlerts.map((alert) => (
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
            {computedMetrics.map((metric) => (
              <StatCard key={metric.label} {...metric} />
            ))}
          </section>

          <section className="charts-grid">
            <ChartCard title="Sales vs Purchase" subtitle="Sample comparison" action="View all">
              <SalesPurchaseChart />
            </ChartCard>

            <ChartCard title="Monthly Revenue" subtitle="Revenue by month">
              <MonthlyRevenueChart values={monthlyRevenueValues} labels={monthlyRevenueLabels} />
            </ChartCard>
          </section>

          <section className="lists-grid">
            <ListCard title="Low Stock Alerts" action="View all">
              {lowStockItems.length === 0 ? (
                <p className="invoice-history-empty">All items are in stock.</p>
              ) : (
                lowStockItems.map((item) => (
                  <div key={item.id} className="alert-row alert-row--warning">
                    <div>
                      <strong>{item.name}</strong>
                      <p>Current stock: {item.stock} {item.unit}</p>
                    </div>
                    <span className="pill pill--warning">Low Stock</span>
                  </div>
                ))
              )}
            </ListCard>

            <ListCard title="Pending Payments" action="View all">
              {pendingInvoices.length === 0 ? (
                <p className="invoice-history-empty">No pending payments.</p>
              ) : (
                pendingInvoices.map((item) => (
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
                ))
              )}
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
                {recentInvoices.length === 0 ? (
                  <tr><td colSpan="4">No recent activity.</td></tr>
                ) : (
                  recentInvoices.map((row) => (
                    <tr key={row.invoiceId}>
                      <td>{row.invoiceId}</td>
                      <td>{row.date}</td>
                      <td>{formatCurrency(row.amount)}</td>
                      <td>
                        <span className={`pill pill--${row.status}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))
                )}
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

function MonthlyRevenueChart({ values, labels }) {
  const width = 640;
  const height = 280;
  const safeValues = values.length > 0 ? values : [0];
  const safeLabels = labels.length > 0 ? labels : ['—'];
  const maxValue = Math.max(...safeValues, 1);
  const chartHeight = height - 40;
  const chartWidth = width - 54;
  const barWidth = Math.max(8, chartWidth / safeValues.length - 14);

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="bar-chart" aria-label="Monthly revenue chart" role="img">
        {renderGridLines(width, height)}
        {safeValues.map((value, index) => {
          const barHeight = (value / maxValue) * chartHeight;
          const x = 32 + index * ((chartWidth / safeValues.length) + 14);
          const y = height - 28 - barHeight;
          return (
            <g key={safeLabels[index]}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="10" className="bar-chart__bar" />
            </g>
          );
        })}
      </svg>
      <div className="chart-labels chart-labels--bars">
        {safeLabels.map((label) => (
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
