import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, setDoc, onSnapshot,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db, firebaseEnabled } from '../firebase';
import { get } from '../utils/storage';

const mondayKey = () => {
  const d   = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
};

const weekDates = () => {
  const today = new Date();
  const day   = today.getDay();
  const start = day === 0 ? 6 : day - 1;
  return Array.from({ length: start + 1 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - start + i);
    return d.toISOString().slice(0, 10);
  });
};

export const useLeaderboard = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseEnabled || !db) { setLoading(false); setEntries([]); return () => {}; }
    const q   = query(collection(db, 'leaderboard'), orderBy('weekPomos', 'desc'), limit(25));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const publishStats = useCallback(async (user) => {
    if (!firebaseEnabled || !db) return;
    if (!user) return;
    const sessions  = get('pomo_sessions', {});
    const settings  = get('pomo_settings', { work: 25, break: 5 });
    const totalPomos = Object.values(sessions).reduce((a, b) => a + b, 0);
    const weekPomos  = weekDates().reduce((sum, k) => sum + (sessions[k] ?? 0), 0);
    try {
      await setDoc(doc(db, 'leaderboard', user.uid), {
        uid:         user.uid,
        displayName: user.displayName || 'Anonymous',
        photoURL:    user.photoURL    || null,
        weekPomos,
        weekMins:   weekPomos  * settings.work,
        weekKey:    mondayKey(),
        totalPomos,
        totalMins:  totalPomos * settings.work,
        updatedAt:  serverTimestamp(),
      }, { merge: true });
    } catch { /* silent — leaderboard is best-effort */ }
  }, []);

  return { entries, loading, publishStats };
};
