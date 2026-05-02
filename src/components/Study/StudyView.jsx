import { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Copy, Check, LogOut, Play, Pause, RotateCcw, Crown, Clock, Zap } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';
import './Study.css';

/* ────────────────────────────────────────
   AVATAR
──────────────────────────────────────── */
const Avatar = ({ member, size = 36 }) => {
  const initials = (member.displayName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = [...(member.uid || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return member.photoURL
    ? <img src={member.photoURL} alt={member.displayName} className="study-avatar" style={{ width: size, height: size }} />
    : <div className="study-avatar study-avatar--init" style={{ width: size, height: size, background: `hsl(${hue},55%,45%)` }}>{initials}</div>;
};

/* ────────────────────────────────────────
   STATUS DOT
──────────────────────────────────────── */
const STATUS = {
  focusing: { label: 'Focusing', cls: 'status--focus' },
  break:    { label: 'On break', cls: 'status--break' },
  idle:     { label: 'Idle',     cls: 'status--idle'  },
};

/* ────────────────────────────────────────
   ROOM TIMER HOOK
   Syncs local countdown with Firestore timer state
──────────────────────────────────────── */
const useRoomTimer = (room, isHost, pushTimer, updatePresence, me) => {
  const [display, setDisplay]     = useState({ mode: 'work', seconds: 1500, running: false, progress: 0 });
  const intervalRef               = useRef(null);
  const prevTimerRef              = useRef(null);
  const focusStartRef             = useRef(null);

  const calcRemaining = useCallback((timer) => {
    if (!timer) return 1500;
    if (timer.running) {
      const elapsed = Math.floor((Date.now() - (timer.updatedAt || Date.now())) / 1000);
      return Math.max(0, timer.seconds - elapsed);
    }
    return timer.seconds;
  }, []);

  useEffect(() => {
    const timer = room?.timer;
    if (!timer) return;

    clearInterval(intervalRef.current);

    const remaining = calcRemaining(timer);
    const total     = timer.total || 1500;

    setDisplay({ mode: timer.mode, seconds: remaining, running: timer.running, progress: 1 - remaining / total });

    // Detect work→break transition for focus time credit
    const prev = prevTimerRef.current;
    if (prev && prev.mode === 'work' && timer.mode === 'break') {
      const earned = Math.round((timer.total || 1500) / 60);
      updatePresence({
        focusMins: (me?.focusMins || 0) + earned,
        sessions:  (me?.sessions  || 0) + 1,
        status: 'break',
      });
      focusStartRef.current = null;
    }
    prevTimerRef.current = timer;

    if (!timer.running) return;

    // Track when user started focusing
    if (timer.mode === 'work' && !focusStartRef.current) {
      focusStartRef.current = Date.now();
      updatePresence({ status: 'focusing' });
    } else if (timer.mode === 'break') {
      updatePresence({ status: 'break' });
    }

    // Local countdown
    let secs = remaining;
    intervalRef.current = setInterval(() => {
      secs -= 1;
      if (secs <= 0) {
        clearInterval(intervalRef.current);
        setDisplay(d => ({ ...d, seconds: 0, running: false, progress: 1 }));
        // Host advances the phase
        if (isHost) {
          const nextMode = timer.mode === 'work' ? 'break' : 'work';
          const nextSecs = (nextMode === 'work' ? (room.settings?.work || 25) : (room.settings?.break || 5)) * 60;
          pushTimer({ mode: nextMode, running: false, seconds: nextSecs, total: nextSecs });
        }
        return;
      }
      setDisplay({ mode: timer.mode, seconds: secs, running: true, progress: 1 - secs / total });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [room?.timer?.updatedAt, room?.timer?.running, room?.timer?.mode]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return display;
};

/* ────────────────────────────────────────
   LOBBY
──────────────────────────────────────── */
const Lobby = () => {
  const { createRoom, joinRoom, joining } = useStudy();
  const [roomName, setRoomName]   = useState('');
  const [joinCode, setJoinCode]   = useState('');
  const [creating, setCreating]   = useState(false);
  const [error, setError]         = useState('');

  const handleCreate = async () => {
    setCreating(true); setError('');
    const res = await createRoom(roomName);
    if (res.error) { setError(res.error); setCreating(false); }
  };

  const handleJoin = async () => {
    if (joinCode.trim().length < 4) { setError('Enter a valid room code.'); return; }
    setError('');
    const res = await joinRoom(joinCode);
    if (res.error) setError(res.error);
  };

  return (
    <div className="study-lobby">
      <div className="study-lobby-hero">
        <div className="study-hero-icon"><Users size={28} /></div>
        <h2 className="study-hero-title">Study Together</h2>
        <p className="study-hero-sub">Create a room or join a friend's session.<br />Stay accountable, focus together.</p>
      </div>

      <div className="study-lobby-cards">
        {/* Create */}
        <div className="study-lobby-card">
          <h3 className="study-card-title"><Zap size={15} /> Create Room</h3>
          <p className="study-card-desc">Start a new study session and invite friends.</p>
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

        {/* Join */}
        <div className="study-lobby-card">
          <h3 className="study-card-title"><Users size={15} /> Join Room</h3>
          <p className="study-card-desc">Enter a 6-character code to join a session.</p>
          <input
            className="field-input"
            placeholder="Room code (e.g. ABC123)"
            value={joinCode}
            maxLength={6}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase' }}
          />
          <button className="btn-primary study-card-btn" onClick={handleJoin} disabled={joining}>
            {joining ? 'Joining…' : 'Join Room'}
          </button>
        </div>
      </div>

      {error && <p className="study-error">{error}</p>}
    </div>
  );
};

/* ────────────────────────────────────────
   ROOM
──────────────────────────────────────── */
const Room = () => {
  const { room, members, me, roomCode, isHost, leaveRoom, pushTimer, updatePresence } = useStudy();
  const timer = useRoomTimer(room, isHost, pushTimer, updatePresence, me);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePlay = () => {
    pushTimer({ mode: timer.mode, running: true, seconds: timer.seconds, total: room.timer?.total || timer.seconds });
  };
  const handlePause = () => {
    pushTimer({ mode: timer.mode, running: false, seconds: timer.seconds, total: room.timer?.total || timer.seconds });
  };
  const handleReset = () => {
    const secs = (timer.mode === 'work' ? (room.settings?.work || 25) : (room.settings?.break || 5)) * 60;
    pushTimer({ mode: timer.mode, running: false, seconds: secs, total: secs });
    updatePresence({ status: 'idle' });
  };

  const mins  = String(Math.floor(timer.seconds / 60)).padStart(2, '0');
  const secs  = String(timer.seconds % 60).padStart(2, '0');
  const color = timer.mode === 'work' ? 'var(--blue)' : 'var(--green)';
  const SIZE  = 220;
  const R     = 96;
  const CIRC  = 2 * Math.PI * R;
  const POFF  = CIRC * (1 - timer.progress);

  const sorted  = [...members].sort((a, b) => (b.focusMins || 0) - (a.focusMins || 0));
  const medals  = ['🥇', '🥈', '🥉'];
  const active  = members.filter(m => Date.now() - (m.lastSeen || 0) < 60_000);

  return (
    <div className="study-room">
      {/* Header */}
      <div className="study-room-header">
        <div className="study-room-title-wrap">
          <h2 className="study-room-name">{room?.name}</h2>
          <button className="study-code-btn" onClick={copyCode} title="Copy code">
            <span className="study-code">{roomCode}</span>
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
        <div className="study-room-header-right">
          <span className="study-online-badge">
            <span className="study-online-dot" />
            {active.length} online
          </span>
          <button className="btn-ghost study-leave-btn" onClick={leaveRoom}>
            <LogOut size={15} /> Leave
          </button>
        </div>
      </div>

      <div className="study-room-body">
        {/* Timer column */}
        <div className="study-timer-col">
          <div className={`study-timer-card ${timer.running ? 'study-timer--running' : ''}`}>
            {!isHost && (
              <p className="study-host-label">
                <Crown size={12} /> Host controls the timer
              </p>
            )}
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible' }}>
              <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
              <circle
                cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
                stroke={color} strokeWidth={8} strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={POFF}
                transform={`rotate(-90 ${SIZE/2} ${SIZE/2})`}
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s', filter: `drop-shadow(0 0 8px ${color})` }}
              />
              <text x={SIZE/2} y={SIZE/2 - 10} textAnchor="middle" dominantBaseline="middle"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 44, fontWeight: 300, fill: '#fff', letterSpacing: -2 }}>
                {mins}:{secs}
              </text>
              <text x={SIZE/2} y={SIZE/2 + 30} textAnchor="middle" dominantBaseline="middle"
                style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: 3, fill: 'rgba(255,255,255,0.38)', textTransform: 'uppercase' }}>
                {timer.mode === 'work' ? 'FOCUS' : 'BREAK'}
              </text>
            </svg>

            {isHost && (
              <div className="study-timer-controls">
                <button className="icon-btn-lg" onClick={handleReset} title="Reset">
                  <RotateCcw size={20} />
                </button>
                <button
                  className={`pomo-play-btn ${timer.mode === 'break' ? 'break-mode' : ''} ${timer.running ? 'running' : ''}`}
                  onClick={timer.running ? handlePause : handlePlay}
                >
                  {timer.running ? <Pause size={26} /> : <Play size={26} />}
                </button>
                <div style={{ width: 48 }} />
              </div>
            )}
          </div>
        </div>

        {/* Members + Leaderboard column */}
        <div className="study-right-col">
          {/* Members */}
          <div className="study-section">
            <h3 className="study-section-title"><Users size={14} /> Members ({members.length})</h3>
            <div className="study-members-list">
              {members
                .slice()
                .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))
                .map(m => {
                  const s = STATUS[m.status] ?? STATUS.idle;
                  const isMe = m.uid === me?.uid;
                  const isRoomHost = m.uid === room?.hostUid;
                  return (
                    <div key={m.uid} className={`study-member ${isMe ? 'study-member--me' : ''}`}>
                      <Avatar member={m} size={34} />
                      <div className="study-member-info">
                        <span className="study-member-name">
                          {m.displayName?.split(' ')[0]}
                          {isRoomHost && <Crown size={11} className="study-crown" />}
                          {isMe && <span className="study-you-badge">you</span>}
                        </span>
                        <span className={`study-status-badge ${s.cls}`}>{s.label}</span>
                      </div>
                      <span className="study-member-mins">
                        <Clock size={11} />
                        {m.focusMins || 0}m
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="study-section">
            <h3 className="study-section-title">🏆 Leaderboard</h3>
            <div className="study-leaderboard">
              {sorted.length === 0
                ? <p className="study-empty">No focus time yet — start the timer!</p>
                : sorted.map((m, i) => (
                  <div key={m.uid} className={`study-lb-row ${i === 0 ? 'study-lb-row--first' : ''}`}>
                    <span className="study-lb-rank">{medals[i] ?? `${i + 1}.`}</span>
                    <Avatar member={m} size={26} />
                    <span className="study-lb-name">{m.displayName?.split(' ')[0]}</span>
                    <span className="study-lb-stat">
                      <strong>{m.focusMins || 0}</strong> min
                      {m.sessions > 0 && <span className="study-lb-sessions"> · {m.sessions} sessions</span>}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────── */
export const StudyView = () => {
  const { inRoom } = useStudy();
  return (
    <div className="study-page">
      {!inRoom && (
        <div className="page-header">
          <h1 className="page-title">Study Together</h1>
        </div>
      )}
      {inRoom ? <Room /> : <Lobby />}
    </div>
  );
};
