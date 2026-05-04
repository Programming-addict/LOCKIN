import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  doc, collection, setDoc, getDoc, getDocs, onSnapshot,
  deleteDoc, updateDoc, writeBatch, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db, firebaseEnabled } from '../firebase';
import { useAuth } from './AuthContext';

/* ─── Constants ─── */
const PRESENCE_INTERVAL = 15_000;   // heartbeat every 15 s
const IDLE_THRESHOLD    = 60_000;   // no heartbeat for 60 s → idle

/* ─── Firestore refs ─── */
const roomRef    = (code)       => doc(db, 'studyRooms', code);
const memberRef  = (code, uid)  => doc(db, 'studyRooms', code, 'members', uid);
const membersCol = (code)       => collection(db, 'studyRooms', code, 'members');

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

  const [roomCode, setRoomCode] = useState(() => sessionStorage.getItem('study_room') || null);
  const [room,    setRoom]      = useState(null);
  const [members, setMembers]   = useState([]);
  const [joining, setJoining]   = useState(false);
  const [error,   setError]     = useState('');

  const unsubRoom    = useRef(null);
  const unsubMembers = useRef(null);
  const heartbeatRef = useRef(null);
  const completedRef = useRef(false);   // dedup guard for completeSession

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
        setRoomCode(null); setRoom(null);
        return;
      }
      const data = snap.data();
      // Reset dedup guard when phase changes
      if (data.status !== 'focus') completedRef.current = false;
      setRoom({ code: roomCode, ...data });
    }, () => { setRoomCode(null); });

    unsubMembers.current = onSnapshot(membersCol(roomCode), snap => {
      setMembers(snap.docs.map(d => d.data()));
    });

    // Presence heartbeat
    const pulse = () => {
      if (!db) return;
      setDoc(memberRef(roomCode, user.uid),
        { status: 'active', lastActive: Date.now() }, { merge: true }
      ).catch(() => {});
    };

    const markIdle = () => {
      if (!db) return;
      setDoc(memberRef(roomCode, user.uid),
        { status: 'idle', lastActive: Date.now() }, { merge: true }
      ).catch(() => {});
    };

    pulse();
    heartbeatRef.current = setInterval(pulse, PRESENCE_INTERVAL);

    // Tab visibility
    const onVis = () =>
      document.visibilityState === 'visible' ? pulse() : markIdle();
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
        name:        (name.trim() || `${user.displayName?.split(' ')[0] ?? 'My'}'s Room`),
        hostId:      user.uid,
        status:      'idle',
        sessionEndTime:  null,
        sessionDuration: 25,
        breakDuration:   5,
        createdAt:   serverTimestamp(),
      });
      await setDoc(memberRef(code, user.uid), {
        uid:         user.uid,
        displayName: user.displayName || 'Anonymous',
        photoURL:    user.photoURL    || null,
        status:      'active',
        lastActive:  now,
        totalFocus:  0,
        joinedAt:    now,
      });
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
        status:      'active',
        lastActive:  now,
        totalFocus:  0,
        joinedAt:    now,
      }, { merge: true });
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
    sessionStorage.removeItem('study_room');
    setRoomCode(null); setRoom(null); setMembers([]);
  }, [roomCode, user, room]);

  /* ══════════════════════════════════════════
     START SESSION  (host only)
  ══════════════════════════════════════════ */
  const startSession = useCallback(async (durationMins = 25) => {
    if (!db || room?.hostId !== user?.uid || !roomCode) return;
    completedRef.current = false;
    const now     = Date.now();
    const endTime = Timestamp.fromMillis(now + durationMins * 60 * 1000);
    await updateDoc(roomRef(roomCode), {
      status:          'focus',
      sessionStartTime: Timestamp.fromMillis(now),  // Track start for actual elapsed time
      sessionEndTime:   endTime,
      sessionDuration: durationMins,
    });
  }, [roomCode, room, user]);

  /* ══════════════════════════════════════════
     COMPLETE SESSION  (host only, dedup-safe)
     Called when focus timer hits 0.
     Reads all members, awards focus credits to
     active ones, then transitions to break.
  ══════════════════════════════════════════ */
  const completeSession = useCallback(async () => {
    if (!db || room?.hostId !== user?.uid || !roomCode) return;
    if (completedRef.current) return;           // dedup guard
    completedRef.current = true;

    try {
      // Re-read room to confirm still in 'focus'
      const roomSnap = await getDoc(roomRef(roomCode));
      if (!roomSnap.exists() || roomSnap.data().status !== 'focus') {
        completedRef.current = false; return;
      }
      const roomData     = roomSnap.data();
      const membersSnap  = await getDocs(membersCol(roomCode));
      const now          = Date.now();

      const batch = writeBatch(db);

      // Award credits to eligible active members
      for (const mSnap of membersSnap.docs) {
        const m = mSnap.data();
        const active = m.status === 'active' && (now - (m.lastActive || 0)) < IDLE_THRESHOLD;
        if (active) {
          batch.update(mSnap.ref, {
            totalFocus: (m.totalFocus || 0) + (roomData.sessionDuration || 25),
          });
        }
      }

      // Transition to break
      const breakMins = roomData.breakDuration || 5;
      const breakEnd  = Timestamp.fromMillis(now + breakMins * 60 * 1000);
      batch.update(roomRef(roomCode), {
        status:        'break',
        sessionEndTime: breakEnd,
      });

      await batch.commit();
    } catch {
      completedRef.current = false;  // allow retry on transient error
    }
  }, [roomCode, room, user]);

  /* ══════════════════════════════════════════
     END BREAK  (host only)
     Called when break timer hits 0.
  ══════════════════════════════════════════ */
  const endBreak = useCallback(async () => {
    if (!db || room?.hostId !== user?.uid || !roomCode) return;
    await updateDoc(roomRef(roomCode), {
      status:        'idle',
      sessionEndTime: null,
    });
  }, [roomCode, room, user]);

  /* ══════════════════════════════════════════
     UPDATE SETTINGS  (host only)
  ══════════════════════════════════════════ */
  const updateRoomSettings = useCallback(async (patch) => {
    if (!db || room?.hostId !== user?.uid || !roomCode) return;
    await updateDoc(roomRef(roomCode), patch);
  }, [roomCode, room, user]);

  const isHost = !!user && room?.hostId === user.uid;
  const inRoom = !!roomCode && !!room;
  const me     = members.find(m => m.uid === user?.uid) ?? null;

  return (
    <StudyContext.Provider value={{
      room, members, me, roomCode, error,
      inRoom, isHost, joining,
      createRoom, joinRoom, leaveRoom,
      startSession, completeSession, endBreak,
      updateRoomSettings,
    }}>
      {children}
    </StudyContext.Provider>
  );
};
