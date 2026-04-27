import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, ChevronDownIcon, SearchIcon } from './icons';
import NotificationPanel from './NotificationPanel';
import { notifications } from '../../data/dashboard';
import { clearStoredUser, getStoredUser } from '../../utils/auth';

export default function DashboardTopbar({ user }) {
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifWrapRef = useRef(null);
  const userMenuRef = useRef(null);

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
    clearStoredUser();
    navigate('/login');
  }

  const sessionUser = user ?? getStoredUser() ?? { initials: 'A', name: 'Admin User', role: 'Administrator' };

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
            aria-label="Notifications"
            aria-haspopup="dialog"
            aria-expanded={isNotifOpen}
            onClick={() => setIsNotifOpen((open) => !open)}
          >
            <BellIcon />
            {notifications.length > 0 && <span className="topbar-icon__dot" />}
          </button>

          {isNotifOpen && (
            <NotificationPanel
              notifications={notifications}
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
              {sessionUser.initials}
            </span>
            <span className="user-chip__meta">
              <strong>{sessionUser.name}</strong>
              <span>{sessionUser.role}</span>
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
