import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { sidebarItems } from '../data/dashboard';
import { reportTabs } from '../data/reports';
import { reportsApi, inventoryApi } from '../api';
import { reportExportIconSrc } from '../utils/images';
import '../styles/dashboard.css';
import '../styles/reports.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  const [salesByMonth, setSalesByMonth] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([reportsApi.sales(), reportsApi.topClients(), inventoryApi.overview()])
      .then(([salesData, topData, overviewData]) => {
        if (cancelled) return;
        setSalesByMonth(salesData);
        setTopClients(topData);
        setOverview(overviewData);
      })
      .catch((err) => !cancelled && setLoadError(err.message || 'Failed to load reports'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const tabContent = useMemo(() => {
    if (loading) return <p>Loading…</p>;
    if (loadError) return <p className="auth-error">{loadError}</p>;
    if (activeTab === 'purchase') {
      return <PurchaseReport sales={salesByMonth} />;
    }
    if (activeTab === 'inventory') {
      return <InventoryReport overview={overview} />;
    }
    return <SalesReport sales={salesByMonth} topClients={topClients} />;
  }, [activeTab, loading, loadError, salesByMonth, topClients, overview]);

  function handleExport() {
    const today = new Date().toISOString().slice(0, 10);
    if (activeTab === 'inventory') {
      const rows = [
        ['Status', 'Count'],
        ...overview.map((row) => [row.label, row.value]),
      ];
      downloadCsv(`inventory-report-${today}.csv`, toCsv(rows));
      return;
    }
    if (activeTab === 'purchase') {
      const { labels, values } = buildMonthlyView(salesByMonth);
      const rows = [
        ['Month', 'Total Purchases'],
        ...labels.map((label, i) => [label, values[i].toFixed(2)]),
      ];
      downloadCsv(`purchase-report-${today}.csv`, toCsv(rows));
      return;
    }
    // Sales tab — emit sales breakdown plus a "Top Clients" section.
    const { labels, values, counts } = buildMonthlyView(salesByMonth);
    const breakdownRows = [
      ['Sales Breakdown'],
      ['Month', 'Invoices', 'Total Sales', 'Avg Invoice Value'],
      ...labels.map((label, i) => [
        label,
        counts[i],
        values[i].toFixed(2),
        (counts[i] > 0 ? values[i] / counts[i] : 0).toFixed(2),
      ]),
    ];
    const topRows = [
      [],
      ['Top Clients'],
      ['Rank', 'Client', 'Invoices', 'Total'],
      ...topClients.map((client, i) => [
        i + 1,
        client.clientName,
        client.invoices,
        Number(client.total || 0).toFixed(2),
      ]),
    ];
    downloadCsv(
      `sales-report-${today}.csv`,
      toCsv([...breakdownRows, ...topRows]),
    );
  }

  return (
    <main className="dashboard-shell">
      <DashboardSidebar brand={{ title: 'Jubba group', subtitle: 'ERP System' }} items={sidebarItems} />

      <section className="dashboard-main">
        <DashboardTopbar />

        <div className="dashboard-content reports-content">
          <div className="reports-header">
            <div className="dashboard-heading">
              <h1>Reports &amp; Analytics</h1>
              <p>View detailed business insights</p>
            </div>

            <button
              type="button"
              className="reports-export-button"
              onClick={handleExport}
              disabled={loading || Boolean(loadError)}
            >
              <img src={reportExportIconSrc} alt="" aria-hidden="true" className="reports-export-icon" />
              Export Report
            </button>
          </div>

          <div className="reports-tabs" role="tablist" aria-label="Report sections">
            {reportTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`reports-tab${activeTab === tab.id ? ' reports-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {tabContent}
        </div>
      </section>
    </main>
  );
}

function buildMonthlyView(sales) {
  // Always render Jan–Jun of the current year, zero-filling missing months so the
  // chart x-axis is stable regardless of which months actually have invoices.
  const currentYear = new Date().getFullYear();
  const totals = new Map();
  const counts = new Map();
  sales.forEach((row) => {
    if (row?.id?.year !== currentYear) return;
    totals.set(row.id.month, Number(row.total) || 0);
    counts.set(row.id.month, Number(row.count) || 0);
  });
  const labels = MONTHS.slice(0, 6);
  const values = [1, 2, 3, 4, 5, 6].map((m) => totals.get(m) || 0);
  const countsArr = [1, 2, 3, 4, 5, 6].map((m) => counts.get(m) || 0);
  return { labels, values, counts: countsArr };
}

function SalesReport({ sales, topClients }) {
  const { labels, values, counts } = buildMonthlyView(sales);
  const breakdown = sales.map((row, idx) => ({
    month: labels[idx],
    invoices: counts[idx],
    totalSales: values[idx],
    avgValue: counts[idx] > 0 ? values[idx] / counts[idx] : 0,
  }));

  return (
    <>
      <section className="reports-grid reports-grid--two">
        <article className="report-card">
          <h2>Sales Trend</h2>
          {values.length === 0 ? <p>No sales data yet.</p> : (
            <LineChart values={values} labels={labels} stroke="#2267b2" />
          )}
        </article>

        <article className="report-card">
          <h2>Top Clients</h2>
          <div className="top-clients">
            {topClients.length === 0 ? (
              <p>No client revenue yet.</p>
            ) : (
              topClients.map((client, index) => (
                <div key={client.id || client.clientName} className="top-client-row">
                  <div className="top-client-row__left">
                    <div className="top-client-row__rank">{index + 1}</div>
                    <div className="top-client-row__meta">
                      <strong>{client.clientName}</strong>
                      <span>{client.invoices} invoice(s)</span>
                    </div>
                  </div>
                  <strong className="top-client-row__amount">{formatTwoDecimals(client.total)}</strong>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="report-card report-card--table">
        <h2>Sales Breakdown</h2>
        <div className="table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Invoices</th>
                <th>Total Sales</th>
                <th>Avg. Invoice Value</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.length === 0 ? (
                <tr><td colSpan="4">No data.</td></tr>
              ) : (
                breakdown.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{row.invoices}</td>
                    <td>{formatThousands(row.totalSales)}</td>
                    <td>{formatTwoDecimals(row.avgValue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function PurchaseReport({ sales }) {
  const { labels, values } = buildMonthlyView(sales);
  return (
    <section className="report-card report-card--full">
      <h2>Purchase Trend</h2>
      {values.length === 0 ? <p>No purchase data yet.</p> : (
        <BarChart values={values} labels={labels} fill="#22c55e" />
      )}
    </section>
  );
}

function InventoryReport({ overview }) {
  const palette = { 'In Stock': '#22c55e', 'Low Stock': '#eab308', 'Out of Stock': '#ef4444' };
  const segments = overview.map((row) => ({
    label: row.label,
    value: row.value,
    color: palette[row.label] || '#94a3b8',
  }));
  const stockSummary = overview.map((row) => ({
    label: row.label,
    value: row.value,
    tone: row.id === 'in-stock' ? 'success' : row.id === 'low-stock' ? 'warning' : 'danger',
  }));
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <section className="reports-grid reports-grid--two">
      <article className="report-card">
        <h2>Inventory Distribution</h2>
        {total === 0 ? <p>No inventory yet.</p> : <PieChart segments={segments} />}
      </article>

      <article className="report-card">
        <h2>Stock Summary</h2>
        <div className="stock-summary">
          {stockSummary.map((item) => (
            <div key={item.label} className={`stock-summary__card stock-summary__card--${item.tone}`}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function LineChart({ values, labels, stroke }) {
  const width = 700;
  const height = 360;
  const padLeft = 60;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 36;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const max = Math.max(...values, 1);
  const maxAxis = niceMax(max);
  const step = maxAxis / 4;
  const yTicks = [0, step, step * 2, step * 3, maxAxis];

  const points = values.map((value, index) => {
    const x = padLeft + (chartW * index) / Math.max(values.length - 1, 1);
    const y = padTop + chartH - (value / maxAxis) * chartH;
    return { x, y };
  });

  return (
    <div className="report-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="report-chart__svg" role="img" aria-label="Line chart">
        {yTicks.map((tick) => {
          const y = padTop + chartH - (tick / maxAxis) * chartH;
          return (
            <g key={`grid-${tick}`} className="chart-grid">
              <line x1={padLeft} x2={width - padRight} y1={y} y2={y} />
              <text
                x={padLeft - 8}
                y={y + 4}
                className="chart-axis__label"
                textAnchor="end"
              >
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        <path d={buildSmoothPath(points)} className="report-line" stroke={stroke} fill="none" />
        {points.map((point, index) => (
          <circle key={`dot-${labels[index]}-${index}`} cx={point.x} cy={point.y} r="4" className="report-line__dot" stroke={stroke} fill={stroke} />
        ))}

        {labels.map((label, index) => {
          const x = padLeft + (chartW * index) / Math.max(values.length - 1, 1);
          return (
            <text
              key={`xlabel-${label}-${index}`}
              x={x}
              y={height - 12}
              className="chart-axis__label"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function BarChart({ values, labels, fill }) {
  const width = 1080;
  const height = 400;
  const padLeft = 60;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 36;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const max = Math.max(...values);
  const maxAxis = niceMax(max);
  const step = maxAxis / 4;
  const yTicks = [0, step, step * 2, step * 3, maxAxis];
  const colWidth = chartW / values.length;
  const barWidth = 16;

  return (
    <div className="report-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="report-chart__svg"
        preserveAspectRatio="none"
        role="img"
        aria-label="Bar chart"
      >
        {yTicks.map((tick) => {
          const y = padTop + chartH - (tick / maxAxis) * chartH;
          return (
            <g key={`grid-${tick}`} className="chart-grid">
              <line x1={padLeft} x2={width - padRight} y1={y} y2={y} />
              <text
                x={padLeft - 8}
                y={y + 4}
                className="chart-axis__label"
                textAnchor="end"
              >
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        {values.map((value, index) => {
          const h = (value / maxAxis) * chartH;
          const x = padLeft + colWidth * index + colWidth / 2 - barWidth / 2;
          const y = padTop + chartH - h;
          return (
            <rect
              key={`bar-${labels[index]}`}
              x={x}
              y={y}
              width={barWidth}
              height={h}
              fill={fill}
            />
          );
        })}

        {labels.map((label, index) => {
          const x = padLeft + colWidth * index + colWidth / 2;
          return (
            <text
              key={`label-${label}`}
              x={x}
              y={height - 12}
              className="chart-axis__label"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function PieChart({ segments }) {
  const cx = 250;
  const cy = 150;
  const radius = 95;
  const labelRadius = 130;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  let accumulated = 0;

  const renderedSegments = segments.map((segment) => {
    const startAngle = (accumulated / total) * Math.PI * 2;
    const sweepAngle = (segment.value / total) * Math.PI * 2;
    const endAngle = startAngle + sweepAngle;
    const midAngle = (startAngle + endAngle) / 2;
    accumulated += segment.value;

    const labelPoint = polarToCartesian(cx, cy, labelRadius, midAngle);
    const anchor = labelPoint.x < cx - 6 ? 'end' : labelPoint.x > cx + 6 ? 'start' : 'middle';

    return {
      ...segment,
      path: describeArc(cx, cy, radius, startAngle, endAngle),
      labelX: labelPoint.x,
      labelY: labelPoint.y,
      anchor,
    };
  });

  return (
    <div className="pie-chart">
      <svg
        viewBox="0 0 500 300"
        className="pie-chart__svg"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Inventory distribution chart"
      >
        {renderedSegments.map((segment) => (
          <path
            key={`slice-${segment.label}`}
            d={segment.path}
            fill={segment.color}
            stroke="#ffffff"
            strokeWidth="1"
          />
        ))}
        {renderedSegments.map((segment) => (
          <text
            key={`label-${segment.label}`}
            x={segment.labelX}
            y={segment.labelY}
            fill={segment.color}
            textAnchor={segment.anchor}
            dominantBaseline="middle"
            className="pie-chart__label"
          >
            {segment.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function escapeCsvCell(value) {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows) {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}

function downloadCsv(filename, csv) {
  const BOM = '﻿';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildSmoothPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function polarToCartesian(cx, cy, r, angle) {
  return {
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  };
}

function formatThousands(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatTwoDecimals(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(value || 0);
}

function niceMax(value) {
  if (value <= 0) return 1;
  const target = value * 1.2;
  const exp = Math.pow(10, Math.floor(Math.log10(target)));
  const fraction = target / exp;
  let nice;
  if (fraction <= 1) nice = 1;
  else if (fraction <= 1.5) nice = 1.5;
  else if (fraction <= 2) nice = 2;
  else if (fraction <= 3) nice = 3;
  else if (fraction <= 4) nice = 4;
  else if (fraction <= 5) nice = 5;
  else if (fraction <= 6) nice = 6;
  else if (fraction <= 8) nice = 8;
  else nice = 10;
  return nice * exp;
}
