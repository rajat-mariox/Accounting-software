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
  const [salesVsPurchase, setSalesVsPurchase] = useState({ labels: [], sales: [], purchases: [] });
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      reportsApi.dashboard(),
      inventoryApi.list(),
      invoicesApi.list(),
      reportsApi.salesVsPurchase(6),
    ])
      .then(([summaryData, itemsData, invoicesData, salesVsPurchaseData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setItems(itemsData);
        setInvoices(invoicesData);
        setSalesVsPurchase(salesVsPurchaseData);
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

  const monthlyRevenueValues = salesVsPurchase.sales?.length ? salesVsPurchase.sales : [0];
  const monthlyRevenueLabels = salesVsPurchase.labels?.length ? salesVsPurchase.labels : ['—'];

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
            <ChartCard title="Sales vs Purchase" subtitle="Sample comparison">
              <SalesPurchaseChart data={salesVsPurchase} />
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

function niceTicks(dataMax, count = 4) {
  if (!Number.isFinite(dataMax) || dataMax <= 0) {
    const ticks = [];
    for (let i = 0; i <= count; i++) ticks.push(i);
    return { ticks, niceMax: count };
  }
  const rawStep = dataMax / count;
  const exponent = Math.floor(Math.log10(rawStep));
  const power = Math.pow(10, exponent);
  const fraction = rawStep / power;
  let niceFraction;
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 2.5) niceFraction = 2.5;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;
  const step = niceFraction * power;
  const ticks = [];
  for (let i = 0; i <= count; i++) ticks.push(step * i);
  return { ticks, niceMax: step * count };
}

function formatTickLabel(value) {
  if (value === 0) return '0';
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (value >= 1000) {
    const k = value / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return Math.round(value).toString();
}

function SalesPurchaseChart({ data }) {
  const width = 640;
  const height = 280;
  const labels = data?.labels?.length ? data.labels : ['—'];
  const sales = data?.sales?.length ? data.sales : [0];
  const purchases = data?.purchases?.length ? data.purchases : [0];
  const dataMax = Math.max(...sales, ...purchases, 1);
  const { ticks, niceMax } = niceTicks(dataMax);
  const salesPoints = createPoints(sales, width, niceMax);
  const purchasePoints = createPoints(purchases, width, niceMax);

  return (
    <div className="chart-wrap">
      <div className="chart-legend">
        <span><i className="legend-dot legend-dot--blue" />Sales</span>
        <span><i className="legend-dot legend-dot--green" />Purchase</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="line-chart" aria-label="Sales versus purchase chart" role="img">
        {renderGridLines(width, ticks)}
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
        {labels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function MonthlyRevenueChart({ values, labels }) {
  const width = 640;
  const height = 320;
  const padTop = 24;
  const padBottom = 56;
  const padLeft = 56;
  const padRight = 24;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const safeValues = values.length > 0 ? values : [0];
  const safeLabels = labels.length > 0 ? labels : ['—'];
  const positiveValues = safeValues.map((v) => Math.max(0, Number(v) || 0));
  const dataMax = Math.max(...positiveValues, 1);
  const { ticks, niceMax } = niceTicks(dataMax);

  const slotWidth = plotWidth / safeValues.length;
  const barWidth = Math.min(48, Math.max(12, slotWidth * 0.55));
  const baselineY = padTop + plotHeight;

  return (
    <div className="chart-wrap chart-wrap--bar">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="bar-chart"
        aria-label="Monthly revenue chart"
        role="img"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="monthly-revenue-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ds-brand)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--ds-brand)" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        <g className="chart-grid" aria-hidden="true">
          {ticks.map((tick, i) => {
            const ratio = niceMax > 0 ? tick / niceMax : 0;
            const y = baselineY - ratio * plotHeight;
            return (
              <g key={`grid-${i}`}>
                <line x1={padLeft} x2={width - padRight} y1={y} y2={y} />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="chart-grid__tick"
                >
                  {formatTickLabel(tick)}
                </text>
              </g>
            );
          })}
        </g>

        <line
          x1={padLeft}
          x2={width - padRight}
          y1={baselineY}
          y2={baselineY}
          className="bar-chart__baseline"
        />

        {safeValues.map((value, i) => {
          const v = Math.max(0, Number(value) || 0);
          const barHeight = (v / niceMax) * plotHeight;
          const slotCenter = padLeft + slotWidth * (i + 0.5);
          const x = slotCenter - barWidth / 2;
          const y = baselineY - barHeight;
          return (
            <g key={`${safeLabels[i]}-${i}`} className="bar-chart__group">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="6"
                className="bar-chart__bar"
                fill="url(#monthly-revenue-bar)"
              />
              {v > 0 && (
                <text
                  x={slotCenter}
                  y={y - 8}
                  textAnchor="middle"
                  className="bar-chart__value"
                >
                  {formatTickLabel(v)}
                </text>
              )}
              <text
                x={slotCenter}
                y={baselineY + 24}
                textAnchor="middle"
                className="bar-chart__label"
              >
                {safeLabels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function renderGridLines(width, ticks) {
  const yPositions = [40, 90, 140, 190, 240];
  return (
    <g className="chart-grid" aria-hidden="true">
      {yPositions.map((y) => (
        <line key={`grid-${y}`} x1="28" x2={width - 12} y1={y} y2={y} />
      ))}
      {Array.isArray(ticks) && ticks.length === yPositions.length
        ? yPositions.map((y, i) => (
            <text
              key={`tick-${y}`}
              x={24}
              y={y + 3}
              textAnchor="end"
              className="chart-grid__tick"
            >
              {formatTickLabel(ticks[ticks.length - 1 - i])}
            </text>
          ))
        : null}
    </g>
  );
}

function createPoints(values, width, niceMax) {
  const padding = 28;
  const usableWidth = width - padding * 2;
  const top = 40;
  const bottom = 240;
  return values.map((value, index) => {
    const x = padding + (usableWidth * index) / Math.max(values.length - 1, 1);
    const ratio = niceMax > 0 ? value / niceMax : 0;
    const y = bottom - ratio * (bottom - top);
    return { x, y };
  });
}

function buildLinePath(points) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
}
