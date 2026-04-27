import React from 'react';
import { CloseIcon } from './icons';

const variantClassMap = {
  warning: 'alert-banner--warning',
  danger: 'alert-banner--danger',
};

export default function AlertBanner({ variant, icon: Icon, title, description, cta, onDismiss }) {
  return (
    <section className={`alert-banner ${variantClassMap[variant] ?? ''}`}>
      <div className="alert-banner__icon">
        <Icon />
      </div>
      <div className="alert-banner__copy">
        <strong>{title}</strong>
        <p>{description}</p>
        <button type="button" className="alert-banner__cta">
          {cta}
        </button>
      </div>
      <button
        type="button"
        className="alert-banner__close"
        aria-label={`Dismiss ${title}`}
        onClick={onDismiss}
      >
        <CloseIcon />
      </button>
    </section>
  );
}

