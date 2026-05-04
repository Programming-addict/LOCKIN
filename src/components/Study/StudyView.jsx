import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Users, Copy, Check, LogOut, Play, Crown, Clock, Zap, Coffee, Globe, Trophy } from 'lucide-react';
import { useStudy }              from '../../context/StudyContext';
import { useAuth  }              from '../../context/AuthContext';
import { useGlobalLeaderboard }  from '../../hooks/useGlobalLeaderboard';
import { LofiPlayer }            from '../Pomodoro/LofiPlayer';
import { recordStudySession } from '../../utils/leaderboard';
import { db } from '../../firebase';
import './Study.css';

/* ══════════════════════════════════════════
   AVATAR
══════════════════════════════════════════ */
const Avatar = ({ member, size = 36 }) => {
  const initials = (member.displayName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = [...(member.uid || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return member.photoURL
    ? <img src={member.photoURL} alt={member.displayName}
        className="study-avatar" style={{ width: size, height: size }}
        referrerPolicy="no-referrer" />
    : <div className="study-avatar study-avatar--init"
        style={{ width: size, height: size, background: `hsl(${hue},55%,45%)` }}>
        {initials}
      </div>;
};

/* ══════════════════════════════════════════
   useRoomTimer
   Source of truth: room.sessionEndTime (Firestore Timestamp).
   Convert to a plain number (ms) before using as a dependency —
   Firestore creates a new Timestamp object on every snapshot even
   when the value hasn't changed, which would restart the interval
   every tick if we used the object directly.
══════════════════════════════════════════ */
const useRoomTimer = (room) => {
  const [remaining, setRemaining] = useState(0);

  // Stable primitive — only changes when the actual end-time changes
  const endMs =
    room?.sessionEndTime?.toMillis?.()
    ?? (typeof room?.sessionEndTime === 'number' ? room.sessionEndTime : null);

  useEffect(() => {
    if (!endMs || room?.status === 'idle') return;
    const update = () => setRemaining(Math.max(0, Math.floor((endMs - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [endMs, room?.status]); // endMs is a number — safe reference comparison

  return !endMs || room?.status === 'idle' ? 0 : remaining;
};

/* ══════════════════════════════════════════
   STATUS helpers
══════════════════════════════════════════ */
const STATUS_MAP = {
  active: { label: 'Active',   cls: 'status--focus' },
  idle:   { label: 'Idle',     cls: 'status--idle'  },
};

const MEDALS = ['🥇', '🥈', '🥉'];

/* ══════════════════════════════════════════
   GLOBAL LEADERBOARD COMPONENT
══════════════════════════════════════════ */
const GlobalLeaderboard = ({ currentUid, compact = false }) => {
  const { entries, loading, weekLabel } = useGlobalLeaderboard(compact ? 10 : 25);

  return (
    <div className="study-global-lb">
      <div className="study-global-lb-header">
        <h3 className="study-section-title"><Globe size={13} /> Global — week of {weekLabel}</h3>
        <span className="study-lb-reset-hint">Resets every Monday</span>
      </div>
      {loading
        ? <p className="study-empty">Loading…</p>
        : entries.length === 0
          ? <p className="study-empty">No sessions logged yet this week. Be first! 🚀</p>
          : <div className="study-leaderboard">
              {entries.map((e, i) => {
                const isMe = e.uid === currentUid;
                const hue  = [...(e.uid || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
                const initials = (e.displayName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={e.uid}
                    className={`study-lb-row ${i === 0 ? 'study-lb-row--first' : ''} ${isMe ? 'study-lb-row--me' : ''}`}>
                    <span className="study-lb-rank">{MEDALS[i] ?? `${i + 1}.`}</span>
                    {e.photoURL
                      ? <img src={e.photoURL} alt={e.displayName} className="study-avatar"
                          style={{ width: 26, height: 26 }} referrerPolicy="no-referrer" />
                      : <div className="study-avatar study-avatar--init"
                          style={{ width: 26, height: 26, fontSize: 10, background: `hsl(${hue},55%,45%)` }}>
                          {initials}
                        </div>
                    }
                    <span className="study-lb-name">
                      {e.displayName?.split(' ')[0]}
                      {isMe && <span className="study-you-badge">you</span>}
                    </span>
                    <span className="study-lb-stat">
                      <strong>{e.focusMins}</strong>m
                      <span className="study-lb-sessions"> · {e.sessions} {e.sessions === 1 ? 'session' : 'sessions'}</span>
                    </span>
                  </div>
                );
              })}
            </div>
      }
    </div>
  );
};

/* ══════════════════════════════════════════
   LOBBY
══════════════════════════════════════════ */
const Lobby = ({ currentUid }) => {
  const { createRoom, joinRoom, joining, error } = useStudy();
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState('');
  const [localErr, setLocalErr] = useState('');

  const handleCreate = async () => {
    setCreating(true); setLocalErr('');
    const res = await createRoom(roomName);
    if (res?.error) { setLocalErr(res.error); setCreating(false); }
  };

  const handleJoin = async () => {
    if (joinCode.trim().length < 4) { setLocalErr('Enter a valid 6-character code.'); return; }
    setLocalErr('');
    const res = await joinRoom(joinCode);
    if (res?.error) setLocalErr(res.error);
  };

  const displayErr = localErr || error;

  return (
    <div className="study-lobby">
      <div className="study-lobby-hero">
        <div className="study-hero-icon"><Users size={28} /></div>
        <h2 className="study-hero-title">Study Together</h2>
        <p className="study-hero-sub">
          Create a room or join a friend's session.<br />
          One synced timer. Real accountability.
        </p>
      </div>

      <div className="study-lobby-cards">
        <div className="study-lobby-card">
          <h3 className="study-card-title"><Zap size={14} /> Create Room</h3>
          <p className="study-card-desc">Start a session and share the code with friends.</p>
          <input
            className="field-input"
            placeholder="Room name (optional)"
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <button className="btn-primary study-card-btn" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : 'Create Room'}
          </button>
        </div>

        <div className="study-lobby-divider"><span>or</span></div>

        <div className="study-lobby-card">
          <h3 className="study-card-title"><Users size={14} /> Join Room</h3>
          <p className="study-card-desc">Enter a 6-character code to join a session.</p>
          <input
            className="field-input"
            placeholder="Room code — e.g. ABC123"
            value={joinCode}
            maxLength={6}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}
          />
          <button className="btn-primary study-card-btn" onClick={handleJoin} disabled={joining}>
            {joining ? 'Joining…' : 'Join Room'}
          </button>
        </div>
      </div>

      {displayErr && <p className="study-error">{displayErr}</p>}

      {/* Global leaderboard in lobby */}
      <GlobalLeaderboard currentUid={currentUid} />
    </div>
  );
};

/* ══════════════════════════════════════════
   ROOM
══════════════════════════════════════════ */
const Room = () => {
  const {
    room, members, me, roomCode, isHost,
    leaveRoom, startSession, completeSession, endBreak,
  } = useStudy();
  const { user } = useAuth();

  const remaining    = useRoomTimer(room);
  const completedRef = useRef(false);   // dedup: focus → break
  const breakEndRef  = useRef(false);   // dedup: break → idle
  const prevStatus   = useRef(room?.status);
  const [lbTab, setLbTab] = useState('room'); // 'room' | 'global'
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  /* ── Host: detect phase end and advance ── */
  useEffect(() => {
    if (!isHost) return;
    if (room?.status === 'focus' && remaining <= 0 && !completedRef.current) {
      completedRef.current = true;
      completeSession();
    }
    if (room?.status === 'break' && remaining <= 0 && !breakEndRef.current) {
      breakEndRef.current = true;
      endBreak();
    }
  }, [remaining, isHost, room?.status]); // eslint-disable-line

  /* ── Reset dedup guards when phase changes ── */
  useEffect(() => {
    if (room?.status === 'focus') completedRef.current = false;
    if (room?.status !== 'break') breakEndRef.current  = false;
  }, [room?.status]);

  /* ── All members: record global session when focus → break ── */
  useEffect(() => {
    if (prevStatus.current === 'focus' && room?.status === 'break') {
      const now      = Date.now();
      const isActive = me?.status === 'active' && (now - (me?.lastActive || 0)) < 60_000;
      if (isActive && user && room) {
        // Calculate actual focus time (in case session was paused early)
        const startMs = room.sessionStartTime?.toMillis?.()
                     ?? (typeof room.sessionStartTime === 'number' ? room.sessionStartTime : null);
        const endMs   = room.sessionEndTime?.toMillis?.()
                     ?? (typeof room.sessionEndTime === 'number' ? room.sessionEndTime : null);

        let actualMins = room.sessionDuration || 25;
        if (startMs && endMs && endMs > startMs) {
          actualMins = Math.floor((endMs - startMs) / 60_000);
          actualMins = Math.max(1, Math.min(actualMins, room.sessionDuration || 25)); // clamp: 1 min → full duration
        }

        // Record to both global leaderboard + weekly review
        recordStudySession(user, actualMins);
      }
    }
    prevStatus.current = room?.status;
  }, [room?.status, room?.sessionStartTime, room?.sessionEndTime]); // eslint-disable-line

  /* ── Copy code ── */
  const [copied, setCopied] = useState(false);
  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ── Timer display ── */
  const mins  = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs  = String(remaining % 60).padStart(2, '0');
  const total = room?.status === 'focus'
    ? (room.sessionDuration || 25) * 60
    : (room?.breakDuration  || 5)  * 60;
  const progress  = total > 0 ? 1 - remaining / total : 0;
  const isRunning = room?.status === 'focus' || room?.status === 'break';
  const color     = room?.status === 'break' ? 'var(--green)' : 'var(--blue)';

  const SIZE = 220, R = 96, CIRC = 2 * Math.PI * R;
  const POFF = CIRC * (1 - Math.min(1, Math.max(0, progress)));

  /* ── Members ── */
  const active     = members.filter(m => nowMs - (m.lastActive || 0) < 60_000);
  const sorted     = [...members].sort((a, b) => (b.totalFocus || 0) - (a.totalFocus || 0));

  /* ── Phase label ── */
  const phaseLabel =
    room?.status === 'focus' ? 'FOCUS' :
    room?.status === 'break' ? 'BREAK' : 'READY';

  return (
    <div className="study-room">
      {/* ── Header ── */}
      <div className="study-room-header">
        <div className="study-room-title-wrap">
          <h2 className="study-room-name">{room?.name}</h2>
          <button className="study-code-btn" onClick={copyCode} title="Copy room code">
            <span className="study-code">{roomCode}</span>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
        <div className="study-room-header-right">
          <span className="study-online-badge">
            <span className="study-online-dot" />
            {active.length} online
          </span>
          <button className="btn-ghost study-leave-btn" onClick={leaveRoom}>
            <LogOut size={14} /> Leave
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="study-room-body">
        {/* Timer column */}
        <div className="study-timer-col">
          <div className={`study-timer-card ${isRunning ? 'study-timer--running' : ''}`}
               style={{ '--timer-color': color }}>

            {!isHost && room?.status === 'idle' && (
              <p className="study-host-label"><Crown size={12} /> Waiting for host to start…</p>
            )}

            {/* Ring */}
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible' }}>
              <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
                stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
              <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
                stroke={color} strokeWidth={8} strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={POFF}
                transform={`rotate(-90 ${SIZE/2} ${SIZE/2})`}
                style={{
                  transition: 'stroke-dashoffset 0.5s linear, stroke 0.4s',
                  filter: `drop-shadow(0 0 8px ${color})`,
                }}
              />
              <text x={SIZE/2} y={SIZE/2 - 12} textAnchor="middle" dominantBaseline="middle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: room?.status === 'idle' ? 28 : 44,
                  fontWeight: 300, fill: '#fff', letterSpacing: -2 }}>
                {room?.status === 'idle'
                  ? `${room?.sessionDuration || 25}:00`
                  : `${mins}:${secs}`}
              </text>
              <text x={SIZE/2} y={SIZE/2 + 28} textAnchor="middle" dominantBaseline="middle"
                style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                  letterSpacing: 3, fill: 'rgba(255,255,255,0.38)' }}>
                {phaseLabel}
              </text>
            </svg>

            {/* Controls — host only */}
            {isHost && (
              <div className="study-timer-controls">
                {room?.status === 'idle' && (
                  <>
                    <select className="study-dur-select"
                      value={room?.sessionDuration || 25}
                      onChange={e => db && updateDoc(doc(db, 'studyRooms', roomCode), { sessionDuration: +e.target.value })}>
                      {[10, 15, 20, 25, 30, 45, 50, 60].map(n => (
                        <option key={n} value={n}>{n} min</option>
                      ))}
                    </select>
                    <button
                      className="pomo-play-btn"
                      onClick={() => startSession(room?.sessionDuration || 25)}
                    >
                      <Play size={26} />
                    </button>
                  </>
                )}
                {room?.status === 'break' && (
                  <button className="btn-ghost study-skip-btn"
                    onClick={endBreak}>
                    Skip Break
                  </button>
                )}
                {room?.status === 'focus' && (
                  <p className="study-host-label" style={{ color: 'var(--blue)' }}>
                    Session in progress…
                  </p>
                )}
              </div>
            )}

            {/* Break icon for members */}
            {!isHost && room?.status === 'break' && (
              <p className="study-host-label">
                <Coffee size={12} /> Break time — stay nearby!
              </p>
            )}
          </div>

          {/* Session stats */}
          <div className="study-session-stats">
            <div className="study-stat">
              <Clock size={13} />
              <span>{room?.sessionDuration || 25}m focus</span>
            </div>
            <div className="study-stat">
              <Coffee size={13} />
              <span>{room?.breakDuration || 5}m break</span>
            </div>
          </div>

          <div className="study-music-wrap">
            <LofiPlayer
              syncWithTimer={false}
              storageKey={`study_lofi_${roomCode}`}
              title="Room Music"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="study-right-col">
          {/* Members */}
          <div className="study-section">
            <h3 className="study-section-title">
              <Users size={13} /> Members ({members.length})
            </h3>
            <div className="study-members-list">
              {members
                .slice().sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))
                .map(m => {
                  const isMe      = m.uid === user?.uid;
                  const isRmHost  = m.uid === room?.hostId;
                  const online    = nowMs - (m.lastActive || 0) < 60_000;
                  const s         = STATUS_MAP[online ? (m.status || 'active') : 'idle'] ?? STATUS_MAP.idle;
                  return (
                    <div key={m.uid} className={`study-member ${isMe ? 'study-member--me' : ''}`}>
                      <div className="study-avatar-wrap">
                        <Avatar member={m} size={34} />
                        <span className={`study-presence-dot ${online ? 'online' : ''}`} />
                      </div>
                      <div className="study-member-info">
                        <span className="study-member-name">
                          {m.displayName?.split(' ')[0]}
                          {isRmHost && <Crown size={11} className="study-crown" title="Host" />}
                          {isMe     && <span className="study-you-badge">you</span>}
                        </span>
                        <span className={`study-status-badge ${s.cls}`}>{s.label}</span>
                      </div>
                      <span className="study-member-mins">
                        <Clock size={11} />
                        {m.totalFocus || 0}m
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Leaderboard — tabbed: Room | Global */}
          <div className="study-section">
            <div className="study-lb-tab-row">
              <h3 className="study-section-title">🏆 Leaderboard</h3>
              <div className="study-lb-tabs">
                <button className={`study-lb-tab ${lbTab === 'room'   ? 'active' : ''}`} onClick={() => setLbTab('room')}>
                  <Users size={11} /> Room
                </button>
                <button className={`study-lb-tab ${lbTab === 'global' ? 'active' : ''}`} onClick={() => setLbTab('global')}>
                  <Globe size={11} /> Global
                </button>
              </div>
            </div>

            {lbTab === 'room' && (
              <div className="study-leaderboard">
                {sorted.every(m => !m.totalFocus)
                  ? <p className="study-empty">Complete a session to earn focus minutes!</p>
                  : sorted.map((m, i) => (
                    <div key={m.uid}
                      className={`study-lb-row ${i === 0 ? 'study-lb-row--first' : ''} ${m.uid === user?.uid ? 'study-lb-row--me' : ''}`}>
                      <span className="study-lb-rank">{MEDALS[i] ?? `${i + 1}.`}</span>
                      <Avatar member={m} size={26} />
                      <span className="study-lb-name">
                        {m.displayName?.split(' ')[0]}
                        {m.uid === user?.uid && <span className="study-you-badge">you</span>}
                      </span>
                      <span className="study-lb-stat"><strong>{m.totalFocus || 0}</strong>m</span>
                    </div>
                  ))
                }
              </div>
            )}

            {lbTab === 'global' && (
              <GlobalLeaderboard currentUid={user?.uid} compact />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export const StudyView = () => {
  const { inRoom } = useStudy();
  const { user }   = useAuth();
  return (
    <div className="study-page">
      {!inRoom && (
        <div className="page-header">
          <h1 className="page-title">Study Together</h1>
        </div>
      )}
      {inRoom ? <Room /> : <Lobby currentUid={user?.uid} />}
    </div>
  );
};
