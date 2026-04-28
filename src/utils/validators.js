const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidEmail(value) {
  if (!isNonEmpty(value)) return false;
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidPhone(value) {
  if (!isNonEmpty(value)) return false;
  return PHONE_PATTERN.test(value.trim());
}

export function sanitizePhoneInput(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 10);
}

export function isValidISODate(value) {
  if (!isNonEmpty(value)) return false;
  if (!ISO_DATE_PATTERN.test(value.trim())) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export function isPositiveNumber(value) {
  if (value === '' || value === null || value === undefined) return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}

export function isNonNegativeNumber(value) {
  if (value === '' || value === null || value === undefined) return false;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0;
}

export function isPositiveInteger(value) {
  if (value === '' || value === null || value === undefined) return false;
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

export function isStrongEnoughPassword(value, minLength = 6) {
  return typeof value === 'string' && value.length >= minLength;
}

export function isDueAfterCreated(createdDate, dueDate) {
  if (!isValidISODate(createdDate) || !isValidISODate(dueDate)) return false;
  return new Date(dueDate).getTime() >= new Date(createdDate).getTime();
}
