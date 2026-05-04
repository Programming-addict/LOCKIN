import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, gProvider, firebaseEnabled } from '../firebase';
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
  const [authError, setAuthError] = useState(null);
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
    if (!firebaseEnabled || !auth || !db) {
      setUser(null);
      return () => {};
    }

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
  const toFriendlyAuthError = (e) => {
    const code = e?.code || '';
    if (code === 'auth/popup-blocked') return 'Popup blocked. Allow popups for this site and try again.';
    if (code === 'auth/popup-closed-by-user') return 'Sign-in popup was closed.';
    if (code === 'auth/cancelled-popup-request') return 'Another sign-in popup is already open.';
    if (code === 'auth/operation-not-allowed') return 'Google sign-in is disabled in Firebase Auth. Enable Google provider.';
    if (code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
      return `Unauthorized domain. Add ${host} to Firebase Auth → Settings → Authorized domains.`;
    }
    return e?.message || 'Sign-in failed.';
  };

  const signIn = async () => {
    if (!firebaseEnabled || !auth || !gProvider) {
      const msg = 'Firebase is not configured. Set VITE_FIREBASE_* env vars to enable sign-in.';
      console.warn(msg);
      setAuthError(msg);
      return;
    }
    setAuthError(null);
    try { await signInWithPopup(auth, gProvider); }
    catch (e) {
      console.warn('Sign-in cancelled or failed:', e);
      setAuthError(toFriendlyAuthError(e));
    }
  };

  const signOut = async () => {
    if (!firebaseEnabled || !auth || !db) {
      setUser(null);
      setAuthError(null);
      return;
    }
    if (user) {
      setSyncing(true);
      try { await pushAll(user.uid); } catch { /* best-effort */ }
      finally { setSyncing(false); }
    }
    // Clear the session flag so next sign-in pulls fresh data
    if (user) sessionStorage.removeItem('lockin_synced_' + user.uid);
    unregisterSyncCallback();
    await fbSignOut(auth);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{ user, syncing, signIn, signOut, firebaseEnabled, authError }}>
      {children}
    </AuthContext.Provider>
  );
};
