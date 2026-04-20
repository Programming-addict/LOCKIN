import { useState, useEffect, useCallback } from 'react';
import { get, set } from '../utils/storage';

const KEY = 'reminders';
let nextId = Date.now();

// 'YYYY-MM-DDTHH:MM' → Date
const toDate = (date, time) => new Date(`${date}T${time}:00`);

export const useReminders = () => {
  const [reminders, setReminders] = useState(() => get(KEY, []));

  const persist = useCallback((list) => {
    setReminders(list);
    set(KEY, list);
  }, []);

  // Every 30 s: mark reminders as triggered if their time has passed
  useEffect(() => {
    const check = () => {
      const now  = Date.now();
      const list = get(KEY, []);
      let changed = false;
      const next = list.map(r => {
        if (!r.triggered && toDate(r.date, r.time).getTime() <= now) {
          changed = true;
          return { ...r, triggered: true };
        }
        return r;
      });
      if (changed) persist(next);
    };
    check(); // run immediately on mount
    const iv = setInterval(check, 30_000);
    return () => clearInterval(iv);
  }, [persist]);

  const addReminder = useCallback((date, time, message) => {
    const list = get(KEY, []);
    const r = {
      id:        ++nextId,
      date,
      time,
      message:   message.trim(),
      triggered: toDate(date, time).getTime() <= Date.now(),
      read:      false,
      createdAt: new Date().toISOString(),
    };
    persist([...list, r]);
  }, [persist]);

  const deleteReminder = useCallback((id) => {
    persist(get(KEY, []).filter(r => r.id !== id));
  }, [persist]);

  const markRead = useCallback((id) => {
    persist(get(KEY, []).map(r => r.id === id ? { ...r, read: true } : r));
  }, [persist]);

  const markAllRead = useCallback(() => {
    persist(get(KEY, []).map(r => ({ ...r, read: true })));
  }, [persist]);

  const getForDate = useCallback((dateStr) => {
    return reminders.filter(r => r.date === dateStr);
  }, [reminders]);

  const hasForDate = useCallback((dateStr) => {
    return reminders.some(r => r.date === dateStr);
  }, [reminders]);

  const unreadCount = reminders.filter(r => r.triggered && !r.read).length;
  const upcomingCount = reminders.filter(r => !r.triggered).length;

  return {
    reminders,
    addReminder,
    deleteReminder,
    markRead,
    markAllRead,
    getForDate,
    hasForDate,
    unreadCount,
    upcomingCount,
  };
};
