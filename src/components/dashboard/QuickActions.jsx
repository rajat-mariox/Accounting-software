import React from 'react';

export default function QuickActions({ title, subtitle, actions }) {
  return (
    <section className="quick-actions">
      <div className="section-heading section-heading--light">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="quick-actions__grid">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.label} type="button" className="quick-action-card">
              <Icon />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

