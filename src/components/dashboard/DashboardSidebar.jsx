import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { projectLogoSrc } from '../../utils/images';
import HelpDocsModal from './HelpDocsModal';
import '../../styles/help.css';

export default function DashboardSidebar({ brand, items }) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar__brand">
        <div className="dashboard-sidebar__logo-tile">
          <img src={projectLogoSrc} alt="" aria-hidden="true" />
        </div>
        <div className="dashboard-sidebar__brand-text">
          <strong>{brand.title}</strong>
          <p>{brand.subtitle}</p>
        </div>
        {/* <button type="button" className="dashboard-sidebar__collapse" aria-label="Collapse sidebar">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 7l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button> */}
      </div>

      <nav className="dashboard-nav" aria-label="Primary">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={`${item.label}-${index}`}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `dashboard-nav__item${isActive ? ' dashboard-nav__item--active' : ''}`
              }
            >
              {item.iconSrc ? <img src={item.iconSrc} alt="" aria-hidden="true" /> : <Icon />}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="help-card">
        <strong>Need Help?</strong>
        <p>Browse the docs or reach out to support.</p>
        <button
          type="button"
          className="help-card__button"
          onClick={() => setHelpOpen(true)}
        >
          View Docs
        </button>
      </div>

      <HelpDocsModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </aside>
  );
}
