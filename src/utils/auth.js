const USER_KEY = 'auth_user';
const TOKEN_KEY = 'auth_token';

export const DEFAULT_PASSWORD = 'Admin@123';

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.email !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitAuthChanged();
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
  emitAuthChanged();
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function setStoredAuth({ user, token }) {
  if (user) setStoredUser(user);
  if (token) setStoredToken(token);
}

export function clearStoredAuth() {
  clearStoredUser();
  clearStoredToken();
}

function emitAuthChanged() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event('auth-changed'));
  }
}
