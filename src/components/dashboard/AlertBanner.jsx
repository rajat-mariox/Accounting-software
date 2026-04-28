import React from 'react';
import { CloseIcon } from './icons';

const variantClassMap = {
  warning: 'alert-banner--warning',
  danger: 'alert-banner--danger',
};

export default function AlertBanner({ variant, icon: Icon, title, description, cta, onDismiss, onClick }) {
  const handleDismiss = (event) => {
    event.stopPropagation();
    onDismiss?.();
  };

  const handleCta = (event) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <section
      className={`alert-banner ${variantClassMap[variant] ?? ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="alert-banner__icon">
        <Icon />
      </div>
      <div className="alert-banner__copy">
        <strong>{title}</strong>
        <p>{description}</p>
        <button type="button" className="alert-banner__cta" onClick={handleCta}>
          {cta}
        </button>
      </div>
      <button
        type="button"
        className="alert-banner__close"
        aria-label={`Dismiss ${title}`}
        onClick={handleDismiss}
      >
        <CloseIcon />
      </button>
    </section>
  );
}

