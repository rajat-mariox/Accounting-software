import React, { useMemo, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import { sidebarItems } from '../data/dashboard';
import {
  inventoryDistribution,
  purchaseTrend,
  reportTabs,
  salesBreakdown,
  salesTrend,
  stockSummary,
  topClients,
} from '../data/reports';
import { reportExportIconSrc } from '../utils/images';
import '../styles/dashboard.css';
import '../styles/reports.css';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');

  const tabContent = useMemo(() => {
    if (activeTab === 'purchase') {
      return <PurchaseReport />;
    }

    if (activeTab === 'inventory') {
      return <InventoryReport />;
    }

    return <SalesReport />;
  }, [activeTab]);

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

            <button type="button" className="reports-export-button">
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

function SalesReport() {
  return (
    <>
      <section className="reports-grid reports-grid--two">
        <article className="report-card">
          <h2>Sales Trend</h2>
          <LineChart values={salesTrend.values} labels={salesTrend.labels} stroke="#2267b2" />
        </article>

        <article className="report-card">
          <h2>Top Clients</h2>
          <div className="top-clients">
            {topClients.map((client) => (
              <div key={client.rank} className="top-client-row">
                <div className="top-client-row__left">
                  <div className="top-client-row__rank">{client.rank}</div>
                  <div className="top-client-row__meta">
                    <strong>{client.name}</strong>
                    <span>{client.invoices}</span>
                  </div>
                </div>
                <strong className="top-client-row__amount">{formatTwoDecimals(client.amount)}</strong>
              </div>
            ))}
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
              {salesBreakdown.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>{row.invoices}</td>
                  <td>{formatThousands(row.totalSales)}</td>
                  <td>{formatTwoDecimals(row.avgValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function PurchaseReport() {
  return (
    <section className="report-card report-card--full">
      <h2>Purchase Trend</h2>
      <BarChart values={purchaseTrend.values} labels={purchaseTrend.labels} fill="#22c55e" />
    </section>
  );
}

function InventoryReport() {
  return (
    <section className="reports-grid reports-grid--two">
      <article className="report-card">
        <h2>Inventory Distribution</h2>
        <PieChart segments={inventoryDistribution} />
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
  const width = 640;
  const height = 280;
  const padding = 30;
  const points = createPoints(values, width, height, padding);

  return (
    <div className="report-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="report-chart__svg" role="img" aria-label="Line chart">
        {renderGridLines(width, height)}
        <path d={buildLinePath(points)} className="report-line" stroke={stroke} />
        {points.map((point, index) => (
          <circle key={labels[index]} cx={point.x} cy={point.y} r="4" className="report-line__dot" />
        ))}
      </svg>

      <div className="chart-labels">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
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
                {tick}
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
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
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

function renderGridLines(width, height) {
  return (
    <g className="chart-grid" aria-hidden="true">
      {[40, 90, 140, 190, 240].map((y) => (
        <line key={y} x1="30" x2={width - 12} y1={y} y2={y} />
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
  }).format(value);
}

function formatTwoDecimals(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(value);
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
