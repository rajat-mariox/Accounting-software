import { useEffect, useState } from 'react';
import { settingsApi } from '../api';

// Currency & Region settings (Settings -> Currency & Region), cached for the whole
// app so formatters can stay synchronous. Rates are "units of this currency per 1
// unit of the base currency"; a document's amount converts to base as amount / rate.
export const DEFAULT_CURRENCY_SETTINGS = {
  base: 'USD',
  decimals: 2,
  dateFormat: 'DD/MM/YYYY',
  currencies: [
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
    { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh', rate: 571 },
  ],
};

export const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

let current = DEFAULT_CURRENCY_SETTINGS;
let version = 0;
const listeners = new Set();

export function getCurrencySettings() {
  return current;
}

export function setCurrencySettings(next) {
  if (!next || !Array.isArray(next.currencies) || next.currencies.length === 0) return;
  current = { ...DEFAULT_CURRENCY_SETTINGS, ...next };
  version += 1;
  listeners.forEach((fn) => fn(version));
}

let loading = null;
export function loadCurrencySettings() {
  if (!loading) {
    loading = settingsApi
      .get('currency')
      .then((value) => setCurrencySettings(value))
      .catch(() => {})
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

// Re-renders the caller whenever the settings change (used once at the app root).
export function useCurrencySettings() {
  const [, setTick] = useState(version);
  useEffect(() => {
    listeners.add(setTick);
    return () => listeners.delete(setTick);
  }, []);
  return current;
}

export function baseCurrency() {
  return current.base;
}

export function findCurrency(code) {
  const wanted = String(code || current.base).toUpperCase();
  return (
    current.currencies.find((c) => c.code === wanted) || {
      code: wanted,
      name: wanted,
      symbol: wanted,
      rate: 1,
    }
  );
}

export function currencyRate(code) {
  return Number(findCurrency(code).rate) || 1;
}

// Units of `fromCode` per 1 unit of `toCode` using the configured rates.
export function crossRate(fromCode, toCode) {
  return currencyRate(fromCode) / currencyRate(toCode);
}

export function toBase(amount, rate) {
  const r = Number(rate);
  return Number(amount || 0) / (r > 0 ? r : 1);
}

// "$1,234.50", "Sh 1,234.50" — always the configured number of decimals.
export function formatMoney(value, code) {
  const currency = findCurrency(code);
  const decimals = Number.isInteger(current.decimals) ? current.decimals : 2;
  const n = Number(value || 0);
  const number = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(n));
  const symbol = currency.symbol || currency.code;
  const glue = /^[^A-Za-z]$/.test(symbol) ? '' : ' ';
  return `${n < 0 ? '-' : ''}${symbol}${glue}${number}`;
}

// Date shown in the configured format (DD/MM/YYYY by default). Date-only values
// are stored as UTC midnight, so the UTC calendar day is used.
export function formatDisplayDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  if (current.dateFormat === 'MM/DD/YYYY') return `${mm}/${dd}/${yyyy}`;
  if (current.dateFormat === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
  return `${dd}/${mm}/${yyyy}`;
}
