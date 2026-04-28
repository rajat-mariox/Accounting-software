import React from 'react';

function formatRelative(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toISOString().slice(0, 10);
}

export default function NotificationPanel({
  notifications = [],
  unreadCount = 0,
  onItemClick,
  onMarkAllRead,
  onClose,
}) {
  const handleClick = (note) => {
    if (typeof onItemClick === 'function') {
      onItemClick(note);
    } else if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div className="notification-panel" role="dialog" aria-label="Notifications">
      <div className="notification-panel__header">
        <h3>Notifications</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {unreadCount > 0 ? (
            <span className="notification-panel__count">{unreadCount}</span>
          ) : null}
          {unreadCount > 0 && typeof onMarkAllRead === 'function' ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              style={{
                background: 'none',
                border: 'none',
                color: '#2267b2',
                fontSize: 12,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Mark all read
            </button>
          ) : null}
        </div>
      </div>

      <div className="notification-panel__body">
        {notifications.length === 0 ? (
          <p className="notification-panel__empty">You&apos;re all caught up.</p>
        ) : (
          notifications.map((note) => (
            <button
              key={note.id}
              type="button"
              className="notification-item"
              onClick={() => handleClick(note)}
              style={note.read ? { opacity: 0.6 } : undefined}
            >
              <span className={`notification-item__dot notification-item__dot--${note.tone}`} />
              <span className="notification-item__text">
                <strong>{note.title}</strong>
                <span>{note.description}</span>
                {note.createdAt ? (
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatRelative(note.createdAt)}</span>
                ) : null}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
