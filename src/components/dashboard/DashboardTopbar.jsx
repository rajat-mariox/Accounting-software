import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, ChevronDownIcon, SearchIcon } from './icons';
import NotificationPanel from './NotificationPanel';
import { notificationsApi } from '../../api';
import { clearStoredAuth, getStoredUser, getStoredToken } from '../../utils/auth';

const POLL_INTERVAL_MS = 30_000;

function buildInitials(name) {
  return (name || '')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function DashboardTopbar({ user }) {
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [storedUser, setStoredUserState] = useState(() => getStoredUser());
  const notifWrapRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function syncUser() {
      setStoredUserState(getStoredUser());
    }
    window.addEventListener('storage', syncUser);
    window.addEventListener('auth-changed', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('auth-changed', syncUser);
    };
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const { count } = await notificationsApi.unreadCount();
      setUnreadCount(count || 0);
    } catch {
      // soft-fail; bell badge stays at last known value
    }
  }, []);

  const refreshList = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const rows = await notificationsApi.list({ limit: 20 });
      setNotifications(rows);
      setUnreadCount(rows.filter((n) => !n.read).length);
    } catch {
      // soft-fail
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const id = window.setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (isNotifOpen) refreshList();
  }, [isNotifOpen, refreshList]);

  useEffect(() => {
    if (!isNotifOpen && !isUserMenuOpen) return undefined;

    function handleClick(event) {
      if (isNotifOpen && notifWrapRef.current && !notifWrapRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleKey(event) {
      if (event.key === 'Escape') {
        setIsNotifOpen(false);
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isNotifOpen, isUserMenuOpen]);

  function handleLogout() {
    setIsUserMenuOpen(false);
    clearStoredAuth();
    navigate('/login');
  }

  async function handleNotificationClick(note) {
    setIsNotifOpen(false);
    if (note && !note.read) {
      try {
        await notificationsApi.markRead(note.id);
        setNotifications((current) =>
          current.map((n) => (n.id === note.id ? { ...n, read: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    if (note?.link) navigate(note.link);
  }

  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifications((current) => current.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }

  const sessionUser = user ?? storedUser;
  const displayName = sessionUser?.name || sessionUser?.email || 'Signed-out user';
  const displayRole = sessionUser?.role || (sessionUser ? '—' : 'Not signed in');
  const displayInitials = sessionUser?.initials || buildInitials(displayName);

  return (
    <header className="dashboard-topbar">
      <label className="dashboard-search">
        <SearchIcon />
        <input type="search" placeholder="Search anything..." aria-label="Search anything" />
      </label>

      <div className="dashboard-topbar__actions">
        <div className="topbar-notif" ref={notifWrapRef}>
          <button
            className={`topbar-icon${isNotifOpen ? ' topbar-icon--active' : ''}`}
            type="button"
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-haspopup="dialog"
            aria-expanded={isNotifOpen}
            onClick={() => setIsNotifOpen((open) => !open)}
          >
            <BellIcon />
            {unreadCount > 0 && <span className="topbar-icon__dot" />}
          </button>

          {isNotifOpen && (
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              onItemClick={handleNotificationClick}
              onMarkAllRead={handleMarkAllRead}
              onClose={() => setIsNotifOpen(false)}
            />
          )}
        </div>

        <div className="user-menu" ref={userMenuRef}>
          <button
            type="button"
            className={`user-chip${isUserMenuOpen ? ' user-chip--active' : ''}`}
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
            onClick={() => setIsUserMenuOpen((open) => !open)}
          >
            <span className="user-chip__avatar" aria-hidden="true">
              {displayInitials}
            </span>
            <span className="user-chip__meta">
              <strong>{displayName}</strong>
              <span>{displayRole}</span>
            </span>
            <ChevronDownIcon />
          </button>

          {isUserMenuOpen && (
            <div className="user-menu__panel" role="menu">
              <button
                type="button"
                role="menuitem"
                className="user-menu__item user-menu__item--danger"
                onClick={handleLogout}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
