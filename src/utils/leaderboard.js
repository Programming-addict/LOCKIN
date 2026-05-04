import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, firebaseEnabled } from '../firebase';

/* ── Week key: ISO date of the Monday that starts the current week ── */
export const getWeekKey = () => {
  const now = new Date();
  const day  = now.getDay();                          // 0=Sun … 6=Sat
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // back to Monday
  const mon  = new Date(now.getFullYear(), now.getMonth(), diff);
  return mon.toISOString().slice(0, 10);              // "YYYY-MM-DD"
};

/* ── Write one completed focus session to the global leaderboard ── */
export const recordFocusSession = async (user, mins = 25) => {
  if (!firebaseEnabled || !db || !user) return;
  try {
    const ref = doc(db, 'globalLeaderboard', getWeekKey(), 'users', user.uid);
    await setDoc(ref, {
      uid:         user.uid,
      displayName: user.displayName || 'Anonymous',
      photoURL:    user.photoURL    || null,
      focusMins:   increment(mins),
      sessions:    increment(1),
      updatedAt:   serverTimestamp(),
    }, { merge: true });
  } catch { /* non-critical — silently ignore */ }
};
