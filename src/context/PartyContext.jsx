import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  doc, setDoc, getDoc, updateDoc, deleteField,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { get, todayKey } from '../utils/storage';

const PartyContext = createContext(null);
export const useParty = () => useContext(PartyContext);

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const buildMemberSnapshot = (user) => {
  const sessions     = get('pomo_sessions', {});
  const todaySessions = sessions[todayKey()] ?? 0;
  const streakData   = get('streak_data', { current: 0 });
  const pomSettings  = get('pomo_settings', { work: 25, break: 5 });
  return {
    uid:          user.uid,
    displayName:  user.displayName || 'Anonymous',
    photoURL:     user.photoURL   || null,
    joinedAt:     Date.now(),
    isOnline:     true,
    lastSeen:     Date.now(),
    timerMode:    'work',
    timerSeconds: pomSettings.work * 60,
    timerRunning: false,
    todaySessions,
    totalMinutes: todaySessions * pomSettings.work,
    streak:       streakData.current ?? 0,
  };
};

export const PartyProvider = ({ children }) => {
  const { user } = useAuth();
  const [party,   setParty]   = useState(null);
  const [partyId, setPartyId] = useState(() => localStorage.getItem('lockin_party_id'));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const listenerRef  = useRef(null);
  const syncTimerRef = useRef(null);

  /* ── Real-time party listener ── */
  useEffect(() => {
    if (listenerRef.current) { listenerRef.current(); listenerRef.current = null; }
    if (!partyId || !user) { setParty(null); return; }

    const partyRef = doc(db, 'parties', partyId);
    listenerRef.current = onSnapshot(partyRef, (snap) => {
      if (!snap.exists() || snap.data()?.deleted) {
        setParty(null);
        setPartyId(null);
        localStorage.removeItem('lockin_party_id');
        return;
      }
      setParty({ id: snap.id, ...snap.data() });
    }, (err) => console.warn('Party listener error:', err));

    return () => { if (listenerRef.current) { listenerRef.current(); listenerRef.current = null; } };
  }, [partyId, user]);

  /* ── Online presence ── */
  useEffect(() => {
    if (!partyId || !user) return;
    const partyRef = doc(db, 'parties', partyId);
    const setOnline = (v) =>
      updateDoc(partyRef, {
        [`members.${user.uid}.isOnline`]: v,
        [`members.${user.uid}.lastSeen`]: Date.now(),
      }).catch(() => {});

    setOnline(true);
    const onVis = () => setOnline(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', () => setOnline(false));
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      setOnline(false);
    };
  }, [partyId, user]);

  /* ── Create party ── */
  const createParty = useCallback(async (name) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const code     = generateCode();
      const id       = `party_${code}`;
      const partyRef = doc(db, 'parties', id);
      const codeRef  = doc(db, 'partyCodes', code);
      await setDoc(partyRef, {
        name:        name.trim() || 'Study Group',
        code,
        hostUid:     user.uid,
        createdAt:   serverTimestamp(),
        members:     { [user.uid]: buildMemberSnapshot(user) },
        sharedTimer: null,
        deleted:     false,
      });
      await setDoc(codeRef, { partyId: id, deleted: false });
      localStorage.setItem('lockin_party_id', id);
      setPartyId(id);
    } catch (e) {
      setError('Failed to create party. Try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /* ── Join party ── */
  const joinParty = useCallback(async (code) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const normalCode = code.trim().toUpperCase();
      const codeSnap   = await getDoc(doc(db, 'partyCodes', normalCode));
      if (!codeSnap.exists() || codeSnap.data()?.deleted) {
        setError('Party not found. Check the code and try again.');
        return;
      }
      const { partyId: id } = codeSnap.data();
      await updateDoc(doc(db, 'parties', id), {
        [`members.${user.uid}`]: buildMemberSnapshot(user),
      });
      localStorage.setItem('lockin_party_id', id);
      setPartyId(id);
    } catch (e) {
      setError('Failed to join party. Try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /* ── Leave party ── */
  const leaveParty = useCallback(async () => {
    if (!partyId || !user) return;
    const id = partyId;
    setParty(null);
    setPartyId(null);
    localStorage.removeItem('lockin_party_id');
    clearTimeout(syncTimerRef.current);
    try {
      await updateDoc(doc(db, 'parties', id), {
        [`members.${user.uid}`]: deleteField(),
      });
    } catch (e) { console.warn('Leave party error:', e); }
  }, [partyId, user]);

  /* ── Sync timer state (throttled 4s) ── */
  const syncTimerState = useCallback((timerState) => {
    if (!partyId || !user) return;
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'parties', partyId), {
          [`members.${user.uid}.timerMode`]:    timerState.mode,
          [`members.${user.uid}.timerSeconds`]: timerState.seconds,
          [`members.${user.uid}.timerRunning`]: timerState.running,
          [`members.${user.uid}.lastSeen`]:     Date.now(),
        });
      } catch { /* silent — never interrupt timer */ }
    }, 4000);
  }, [partyId, user]);

  /* ── Sync stats after session completes ── */
  const syncStats = useCallback(() => {
    if (!partyId || !user) return;
    const sessions      = get('pomo_sessions', {});
    const todaySessions = sessions[todayKey()] ?? 0;
    const streakData    = get('streak_data', { current: 0 });
    const pomSettings   = get('pomo_settings', { work: 25, break: 5 });
    updateDoc(doc(db, 'parties', partyId), {
      [`members.${user.uid}.todaySessions`]: todaySessions,
      [`members.${user.uid}.totalMinutes`]:  todaySessions * pomSettings.work,
      [`members.${user.uid}.streak`]:        streakData.current ?? 0,
    }).catch(() => {});
  }, [partyId, user]);

  return (
    <PartyContext.Provider value={{
      party,
      partyId,
      isInParty: !!party,
      loading,
      error,
      setError,
      createParty,
      joinParty,
      leaveParty,
      syncTimerState,
      syncStats,
    }}>
      {children}
    </PartyContext.Provider>
  );
};
