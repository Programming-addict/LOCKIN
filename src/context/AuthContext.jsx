import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, gProvider } from '../firebase';
import { registerSyncCallback, unregisterSyncCallback } from '../utils/storage';

// Keys to sync — excludes pomo_state (live timer, changes every second)
const SYNC_KEYS = new Set([
  'todos',
  'reminders',
  'streak_data',
  'daily_goals',
  'goals_history',
  'pomo_sessions',
  'pomo_settings',
  'todos_week_reset',
  'weekly_reflections',
]);

const userDoc = (uid) => doc(db, 'users', uid, 'lockin', 'sync');

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [syncing, setSyncing] = useState(false);
  const timers = useRef({});

  /* ── Firestore helpers ── */
  const pushKey = async (uid, key, value) => {
    try {
      await setDoc(userDoc(uid), { [key]: value, syncedAt: serverTimestamp() }, { merge: true });
    } catch (e) { console.warn('Sync push failed:', e); }
  };

  const pullAll = async (uid) => {
    const snap = await getDoc(userDoc(uid));
    if (!snap.exists()) return false;
    const data = snap.data();
    let wrote = false;
    SYNC_KEYS.forEach(key => {
      if (data[key] !== undefined) {
        localStorage.setItem(key, JSON.stringify(data[key]));
        wrote = true;
      }
    });
    return wrote;
  };

  const pushAll = async (uid) => {
    const data = { syncedAt: serverTimestamp() };
    SYNC_KEYS.forEach(key => {
      const raw = localStorage.getItem(key);
      if (raw !== null) { try { data[key] = JSON.parse(raw); } catch { /* skip */ } }
    });
    await setDoc(userDoc(uid), data, { merge: true });
  };

  /* ── Auth state listener ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser ?? null);

      if (fbUser) {
        // Pull cloud data once per browser session
        const FLAG = 'lockin_synced_' + fbUser.uid;
        if (!sessionStorage.getItem(FLAG)) {
          setSyncing(true);
          sessionStorage.setItem(FLAG, '1');
          try {
            const wrote = await pullAll(fbUser.uid);
            if (wrote) {
              // Reload so all hooks re-initialize with fresh localStorage data
              window.location.reload();
              return;
            }
          } catch (e) { console.warn('Sync pull failed:', e); }
          finally { setSyncing(false); }
        }

        // Register debounced write-back for every storage.set() call
        registerSyncCallback((key, value) => {
          if (!SYNC_KEYS.has(key)) return;
          clearTimeout(timers.current[key]);
          timers.current[key] = setTimeout(() => pushKey(fbUser.uid, key, value), 1500);
        });
      } else {
        unregisterSyncCallback();
      }
    });

    return () => { unsub(); unregisterSyncCallback(); };
  }, []);

  /* ── Public actions ── */
  const signIn = async () => {
    try { await signInWithPopup(auth, gProvider); }
    catch (e) { console.warn('Sign-in cancelled or failed:', e); }
  };

  const signOut = async () => {
    if (user) {
      setSyncing(true);
      try { await pushAll(user.uid); } catch { /* best-effort */ }
      finally { setSyncing(false); }
    }
    // Clear the session flag so next sign-in pulls fresh data
    if (user) sessionStorage.removeItem('lockin_synced_' + user.uid);
    unregisterSyncCallback();
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, syncing, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
