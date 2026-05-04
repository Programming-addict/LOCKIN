import { doc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, firebaseEnabled } from '../firebase';
import { get, set, todayKey } from './storage';

export const getWeekKey = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().slice(0, 10);
};

export const recordFocusSession = async (user, mins = 25) => {
  if (!firebaseEnabled || !db || !user) return;
  try {
    const ref = doc(db, 'globalLeaderboard', getWeekKey(), 'users', user.uid);
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      photoURL: user.photoURL || null,
      focusMins: increment(mins),
      sessions: increment(1),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch {
    // Best-effort only.
  }
};

export const recordLocalPomodoroSession = () => {
  const sessions = get('pomo_sessions', {});
  const key = todayKey();
  sessions[key] = (sessions[key] ?? 0) + 1;
  set('pomo_sessions', sessions);
  return sessions[key];
};

/* ── Record Study Together session: global leaderboard + weekly review ── */
export const recordStudySession = async (user, actualMins = 25) => {
  if (!user) return;
  // Write to global leaderboard (Firestore)
  await recordFocusSession(user, actualMins);
  // Write to weekly review (localStorage)
  recordLocalPomodoroSession();
};
