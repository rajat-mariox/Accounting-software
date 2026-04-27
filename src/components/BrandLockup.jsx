import React from 'react';
import { loginLogoSrc } from '../utils/images';

export default function BrandLockup() {
  return (
    <div className="brand-lockup">
      <LogoMark />
      <span className="brand-name">InvoiceHub</span>
    </div>
  );
}

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <img src={loginLogoSrc} alt="" />
    </span>
  );
}
