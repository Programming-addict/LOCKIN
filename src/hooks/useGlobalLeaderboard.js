import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, firebaseEnabled } from '../firebase';
import { getWeekKey } from '../utils/leaderboard';

export const useGlobalLeaderboard = (maxEntries = 25) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const weekKey = getWeekKey();

  useEffect(() => {
    if (!firebaseEnabled || !db) { setLoading(false); return; }

    const q = query(
      collection(db, 'globalLeaderboard', weekKey, 'users'),
      orderBy('focusMins', 'desc'),
      limit(maxEntries),
    );

    const unsub = onSnapshot(q,
      snap => { setEntries(snap.docs.map(d => d.data())); setLoading(false); },
      ()   => setLoading(false),
    );

    return () => unsub();
  }, [weekKey, maxEntries]);

  // Human-readable label for the week
  const weekLabel = (() => {
    const d = new Date(weekKey);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      + ' – '
      + new Date(d.getTime() + 6 * 86400000)
          .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })();

  return { entries, loading, weekKey, weekLabel };
};
