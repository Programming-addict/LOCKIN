import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  doc, collection, setDoc, getDoc, onSnapshot, deleteDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const StudyContext = createContext(null);
export const useStudy = () => useContext(StudyContext);

const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const roomDoc    = (code) => doc(db, 'studyRooms', code);
const memberDoc  = (code, uid) => doc(db, 'studyRooms', code, 'members', uid);
const membersCol = (code) => collection(db, 'studyRooms', code, 'members');

export const StudyProvider = ({ children }) => {
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState(() => sessionStorage.getItem('study_room') || null);
  const [room, setRoom]         = useState(null);
  const [members, setMembers]   = useState([]);
  const [joining, setJoining]   = useState(false);

  const unsubRoom    = useRef(null);
  const unsubMembers = useRef(null);
  const heartbeat    = useRef(null);

  /* ── Subscribe when roomCode is set ── */
  useEffect(() => {
    unsubRoom.current?.();
    unsubMembers.current?.();
    clearInterval(heartbeat.current);

    if (!roomCode || !user) { setRoom(null); setMembers([]); return; }

    unsubRoom.current = onSnapshot(roomDoc(roomCode), snap => {
      if (!snap.exists()) {
        sessionStorage.removeItem('study_room');
        setRoomCode(null); setRoom(null);
        return;
      }
      setRoom({ code: roomCode, ...snap.data() });
    }, () => { /* permission error — room gone */ setRoomCode(null); });

    unsubMembers.current = onSnapshot(membersCol(roomCode), snap => {
      setMembers(snap.docs.map(d => d.data()));
    });

    const pulse = () => setDoc(memberDoc(roomCode, user.uid),
      { lastSeen: Date.now() }, { merge: true }).catch(() => {});
    pulse();
    heartbeat.current = setInterval(pulse, 25_000);

    return () => {
      unsubRoom.current?.();
      unsubMembers.current?.();
      clearInterval(heartbeat.current);
    };
  }, [roomCode, user]);

  const createRoom = useCallback(async (name) => {
    if (!user) return { error: 'Not signed in' };
    const code = genCode();
    const now  = Date.now();
    const settings = { work: 25, break: 5 };
    try {
      await setDoc(roomDoc(code), {
        name:     (name.trim() || `${user.displayName?.split(' ')[0] ?? 'My'}'s Room`),
        hostUid:  user.uid,
        createdAt: serverTimestamp(),
        settings,
        timer: { mode: 'work', running: false, seconds: settings.work * 60, total: settings.work * 60, updatedAt: now },
      });
      await setDoc(memberDoc(code, user.uid), {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || null,
        status: 'idle', focusMins: 0, sessions: 0,
        lastSeen: now, joinedAt: now,
      });
      sessionStorage.setItem('study_room', code);
      setRoomCode(code);
      return { code };
    } catch (e) { return { error: e.message }; }
  }, [user]);

  const joinRoom = useCallback(async (code) => {
    if (!user) return { error: 'Not signed in' };
    const clean = code.trim().toUpperCase();
    setJoining(true);
    try {
      const snap = await getDoc(roomDoc(clean));
      if (!snap.exists()) return { error: 'Room not found — check the code.' };
      const now = Date.now();
      await setDoc(memberDoc(clean, user.uid), {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || null,
        status: 'idle', focusMins: 0, sessions: 0,
        lastSeen: now, joinedAt: now,
      }, { merge: true });
      sessionStorage.setItem('study_room', clean);
      setRoomCode(clean);
      return { success: true };
    } catch (e) { return { error: e.message }; }
    finally { setJoining(false); }
  }, [user]);

  const leaveRoom = useCallback(async () => {
    if (!roomCode || !user) return;
    clearInterval(heartbeat.current);
    const wasHost = room?.hostUid === user.uid;
    try {
      await deleteDoc(memberDoc(roomCode, user.uid));
      if (wasHost) await deleteDoc(roomDoc(roomCode));
    } catch { /* ignore */ }
    sessionStorage.removeItem('study_room');
    setRoomCode(null); setRoom(null); setMembers([]);
  }, [roomCode, user, room]);

  /* ── Host-only: push timer state to Firestore ── */
  const pushTimer = useCallback(async (timerPatch) => {
    if (!roomCode || room?.hostUid !== user?.uid) return;
    await updateDoc(roomDoc(roomCode), { timer: { ...timerPatch, updatedAt: Date.now() } });
  }, [roomCode, room, user]);

  /* ── Any member: update own status + focus stats ── */
  const updatePresence = useCallback(async (patch) => {
    if (!roomCode || !user) return;
    await setDoc(memberDoc(roomCode, user.uid), { ...patch, lastSeen: Date.now() }, { merge: true });
  }, [roomCode, user]);

  const isHost = !!user && room?.hostUid === user.uid;
  const inRoom = !!roomCode && !!room;
  const me     = members.find(m => m.uid === user?.uid) ?? null;

  return (
    <StudyContext.Provider value={{
      room, members, me, roomCode,
      inRoom, isHost, joining,
      createRoom, joinRoom, leaveRoom,
      pushTimer, updatePresence,
    }}>
      {children}
    </StudyContext.Provider>
  );
};
