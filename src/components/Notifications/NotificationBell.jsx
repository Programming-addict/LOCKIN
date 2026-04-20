import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Clock, AlarmClock } from 'lucide-react';
import { useRemindersContext } from '../../context/RemindersContext';
import './NotificationBell.css';

const fmt12 = (time) => {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const fmtDate = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

export const NotificationBell = () => {
  const { reminders, deleteReminder, markRead, markAllRead, unreadCount } = useRemindersContext();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const triggered  = reminders.filter(r => r.triggered).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const upcoming   = reminders.filter(r => !r.triggered).sort((a, b) => `${a.date}T${a.time}` < `${b.date}T${b.time}` ? -1 : 1);
  const totalCount = reminders.length;

  return (
    <div className="notif-wrap" ref={panelRef}>
      <button
        className={`notif-btn ${open ? 'open' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <div className="notif-header-left">
              <Bell size={15} />
              <span>Reminders</span>
              {totalCount > 0 && <span className="notif-total">{totalCount}</span>}
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button className="notif-action-btn" onClick={markAllRead} title="Mark all read">
                  <CheckCheck size={14} />
                </button>
              )}
              <button className="notif-action-btn" onClick={() => setOpen(false)} title="Close">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="notif-body">
            {totalCount === 0 && (
              <div className="notif-empty">
                <AlarmClock size={28} />
                <span>No reminders set</span>
                <span className="notif-empty-sub">Open the Calendar to add one</span>
              </div>
            )}

            {triggered.length > 0 && (
              <div className="notif-section">
                <div className="notif-section-label">
                  <span className="notif-dot triggered" />
                  Due
                </div>
                {triggered.map(r => (
                  <div key={r.id} className={`notif-item triggered ${r.read ? 'read' : 'unread'}`}>
                    <div className="notif-item-icon">
                      <AlarmClock size={14} />
                    </div>
                    <div className="notif-item-body">
                      <div className="notif-item-msg">{r.message}</div>
                      <div className="notif-item-meta">
                        {fmtDate(r.date)} · {fmt12(r.time)}
                      </div>
                    </div>
                    <div className="notif-item-actions">
                      {!r.read && (
                        <button className="notif-action-btn" onClick={() => markRead(r.id)} title="Mark read">
                          <Check size={12} />
                        </button>
                      )}
                      <button className="notif-action-btn danger" onClick={() => deleteReminder(r.id)} title="Delete">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {upcoming.length > 0 && (
              <div className="notif-section">
                <div className="notif-section-label">
                  <span className="notif-dot upcoming" />
                  Upcoming
                </div>
                {upcoming.map(r => (
                  <div key={r.id} className="notif-item upcoming">
                    <div className="notif-item-icon">
                      <Clock size={14} />
                    </div>
                    <div className="notif-item-body">
                      <div className="notif-item-msg">{r.message}</div>
                      <div className="notif-item-meta">
                        {fmtDate(r.date)} · {fmt12(r.time)}
                      </div>
                    </div>
                    <div className="notif-item-actions">
                      <button className="notif-action-btn danger" onClick={() => deleteReminder(r.id)} title="Delete">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
