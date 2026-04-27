import React from 'react';
import { DashIcon, TrendDownIcon, TrendUpIcon } from './icons';
import { formatCurrency } from '../../utils/formatters';

export default function StatCard({ icon: Icon, label, value, change, trend }) {
  const changeClass =
    trend === 'up' ? 'stat-card__change--up' : trend === 'down' ? 'stat-card__change--down' : 'stat-card__change--neutral';

  return (
    <article className="stat-card">
      <div className="stat-card__header">
        <div className="stat-card__icon">
          <Icon />
        </div>
        <span className={`stat-card__change ${changeClass}`}>
          {trend === 'up' ? <TrendUpIcon /> : trend === 'down' ? <TrendDownIcon /> : <DashIcon />}
          {change}
        </span>
      </div>
      <p>{label}</p>
      <strong>{typeof value === 'number' ? formatStatValue(value) : value}</strong>
    </article>
  );
}

function formatStatValue(value) {
  if (value >= 1000000) {
    return formatCurrency(value).replace('.0', '');
  }

  if (value >= 1000) {
    return formatCurrency(value);
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(value);
}
