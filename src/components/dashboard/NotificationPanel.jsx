import React from 'react';

export default function NotificationPanel({ notifications, onClose }) {
  return (
    <div className="notification-panel" role="dialog" aria-label="Notifications">
      <div className="notification-panel__header">
        <h3>Notifications</h3>
        {notifications.length > 0 && (
          <span className="notification-panel__count">{notifications.length}</span>
        )}
      </div>

      <div className="notification-panel__body">
        {notifications.length === 0 ? (
          <p className="notification-panel__empty">You're all caught up.</p>
        ) : (
          notifications.map((note) => (
            <button
              key={note.id}
              type="button"
              className="notification-item"
              onClick={onClose}
            >
              <span className={`notification-item__dot notification-item__dot--${note.tone}`} />
              <span className="notification-item__text">
                <strong>{note.title}</strong>
                <span>{note.description}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
