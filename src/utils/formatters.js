import { formatMoney } from './currency';

// Money in the given currency (defaults to the base currency from
// Settings -> Currency & Region), always with the configured decimals.
export function formatCurrency(value, currencyCode) {
  return formatMoney(value, currencyCode);
}
