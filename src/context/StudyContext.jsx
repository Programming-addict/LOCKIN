import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  doc, collection, setDoc, getDoc, onSnapshot,
  deleteDoc, increment, serverTimestamp,
} from 'firebase/firestore';
import { db, firebaseEnabled } from '../firebase';
import { useAuth } from './AuthContext';

/* ─── Constants ─── */
const PRESENCE_INTERVAL = 15_000;

/* ─── Firestore refs ─── */
const roomRef    = (code)      => doc(db, 'studyRooms', code);
const memberRef  = (code, uid) => doc(db, 'studyRooms', code, 'members', uid);
const membersCol = (code)      => collection(db, 'studyRooms', code, 'members');
const userRef    = (uid)       => doc(db, 'users', uid);

/* ─── Room code generator ─── */
const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

/* ─── Context ─── */
const StudyContext = createContext(null);
export const useStudy = () => useContext(StudyContext);

export const StudyProvider = ({ children }) => {
  const { user } = useAuth();

  const [roomCode, setRoomCode] = useState(null);
  const [room,    setRoom]      = useState(null);
  const [members, setMembers]   = useState([]);
  const [joining, setJoining]   = useState(false);
  const [error,   setError]     = useState('');

  const unsubRoom    = useRef(null);
  const unsubMembers = useRef(null);
  const heartbeatRef = useRef(null);

  /* ══════════════════════════════════════════
     ON MOUNT: restore room from sessionStorage
     or Firestore (cross-device sync)
  ══════════════════════════════════════════ */
  useEffect(() => {
    if (!user) return;

    // Fast path: same browser/tab
    const sess = sessionStorage.getItem('study_room');
    if (sess) { setRoomCode(sess); return; }

    // Slow path: cross-device — read activeRoom from user doc
    if (!firebaseEnabled || !db) return;
    getDoc(userRef(user.uid)).then(snap => {
      const activeRoom = snap.data()?.activeRoom;
      if (activeRoom) {
        sessionStorage.setItem('study_room', activeRoom);
        setRoomCode(activeRoom);
      }
    }).catch(() => {});
  }, [user]);

  /* ══════════════════════════════════════════
     SUBSCRIPTIONS
  ══════════════════════════════════════════ */
  useEffect(() => {
    unsubRoom.current?.();
    unsubMembers.current?.();
    clearInterval(heartbeatRef.current);

    if (!firebaseEnabled || !db || !roomCode || !user) {
      setRoom(null); setMembers([]); return;
    }

    unsubRoom.current = onSnapshot(roomRef(roomCode), snap => {
      if (!snap.exists()) {
        sessionStorage.removeItem('study_room');
        setDoc(userRef(user.uid), { activeRoom: null }, { merge: true }).catch(() => {});
        setRoomCode(null); setRoom(null);
        return;
      }
      setRoom({ code: roomCode, ...snap.data() });
    }, () => { setRoomCode(null); });

    unsubMembers.current = onSnapshot(membersCol(roomCode), snap => {
      setMembers(snap.docs.map(d => d.data()));
    });

    /* Heartbeat — keeps presence fresh */
    const pulse = () => {
      if (!db) return;
      setDoc(memberRef(roomCode, user.uid),
        { lastActive: Date.now() }, { merge: true }
      ).catch(() => {});
    };

    pulse();
    heartbeatRef.current = setInterval(pulse, PRESENCE_INTERVAL);

    const onVis = () => {
      if (document.visibilityState === 'visible') pulse();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      unsubRoom.current?.();
      unsubMembers.current?.();
      clearInterval(heartbeatRef.current);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [roomCode, user]);

  /* ══════════════════════════════════════════
     CREATE ROOM
  ══════════════════════════════════════════ */
  const createRoom = useCallback(async (name) => {
    if (!firebaseEnabled || !db) return { error: 'Firebase not configured.' };
    if (!user) return { error: 'Not signed in.' };
    setError('');

    const code = genCode();
    const now  = Date.now();
    try {
      await setDoc(roomRef(code), {
        name:      (name.trim() || `${user.displayName?.split(' ')[0] ?? 'My'}'s Room`),
        hostId:    user.uid,
        createdAt: serverTimestamp(),
      });
      await setDoc(memberRef(code, user.uid), {
        uid:         user.uid,
        displayName: user.displayName || 'Anonymous',
        photoURL:    user.photoURL    || null,
        status:      'idle',
        lastActive:  now,
        totalFocus:  0,
        joinedAt:    now,
        currentSessionStart: null,
      });
      // Cross-device: persist activeRoom on user doc
      await setDoc(userRef(user.uid), { activeRoom: code }, { merge: true });
      sessionStorage.setItem('study_room', code);
      setRoomCode(code);
      return { code };
    } catch (e) {
      const msg = e?.code === 'permission-denied'
        ? 'Permission denied — update your Firestore rules.'
        : (e?.message || 'Failed to create room.');
      setError(msg);
      return { error: msg };
    }
  }, [user]);

  /* ══════════════════════════════════════════
     JOIN ROOM
  ══════════════════════════════════════════ */
  const joinRoom = useCallback(async (code) => {
    if (!firebaseEnabled || !db) return { error: 'Firebase not configured.' };
    if (!user) return { error: 'Not signed in.' };
    const clean = code.trim().toUpperCase();
    setJoining(true); setError('');
    try {
      const snap = await getDoc(roomRef(clean));
      if (!snap.exists()) return { error: 'Room not found — check the code.' };
      const now = Date.now();
      await setDoc(memberRef(clean, user.uid), {
        uid:         user.uid,
        displayName: user.displayName || 'Anonymous',
        photoURL:    user.photoURL    || null,
        status:      'idle',
        lastActive:  now,
        totalFocus:  0,
        joinedAt:    now,
        currentSessionStart: null,
      }, { merge: true });
      // Cross-device: persist activeRoom on user doc
      await setDoc(userRef(user.uid), { activeRoom: clean }, { merge: true });
      sessionStorage.setItem('study_room', clean);
      setRoomCode(clean);
      return { success: true };
    } catch (e) {
      const msg = e?.message || 'Failed to join room.';
      setError(msg);
      return { error: msg };
    } finally { setJoining(false); }
  }, [user]);

  /* ══════════════════════════════════════════
     LEAVE ROOM
  ══════════════════════════════════════════ */
  const leaveRoom = useCallback(async () => {
    if (!firebaseEnabled || !db || !roomCode || !user) return;
    clearInterval(heartbeatRef.current);
    const wasHost = room?.hostId === user.uid;
    try {
      await deleteDoc(memberRef(roomCode, user.uid));
      if (wasHost) await deleteDoc(roomRef(roomCode));
    } catch { /* ignore */ }
    // Clear cross-device activeRoom
    setDoc(userRef(user.uid), { activeRoom: null }, { merge: true }).catch(() => {});
    sessionStorage.removeItem('study_room');
    setRoomCode(null); setRoom(null); setMembers([]);
  }, [roomCode, user, room]);

  /* ══════════════════════════════════════════
     SYNC PRESENCE
     Called by PomodoroTimer when state changes.
     Updates this member's status + session start.
  ══════════════════════════════════════════ */
  const syncRoomPresence = useCallback(async (patch) => {
    if (!db || !roomCode || !user) return;
    await setDoc(memberRef(roomCode, user.uid), {
      ...patch,
      lastActive: Date.now(),
    }, { merge: true });
  }, [roomCode, user]);

  /* ══════════════════════════════════════════
     AWARD ROOM FOCUS
     Called by PomodoroTimer on session complete.
     Increments this member's totalFocus counter.
  ══════════════════════════════════════════ */
  const awardRoomFocus = useCallback(async (mins) => {
    if (!db || !roomCode || !user) return;
    await setDoc(memberRef(roomCode, user.uid), {
      totalFocus:          increment(mins),
      status:              'idle',
      currentSessionStart: null,
      lastActive:          Date.now(),
    }, { merge: true });
  }, [roomCode, user]);

  const isHost = !!user && room?.hostId === user.uid;
  const inRoom = !!roomCode && !!room;
  const me     = members.find(m => m.uid === user?.uid) ?? null;

  return (
    <StudyContext.Provider value={{
      room, members, me, roomCode, error,
      inRoom, isHost, joining,
      createRoom, joinRoom, leaveRoom,
      syncRoomPresence, awardRoomFocus,
    }}>
      {children}
    </StudyContext.Provider>
  );
};
