import { useState, useEffect } from 'react';
import { Users, Copy, Check, LogOut, Clock, Zap, Globe, Target } from 'lucide-react';
import { useStudy }              from '../../context/StudyContext';
import { useAuth  }              from '../../context/AuthContext';
import { useGlobalLeaderboard }  from '../../hooks/useGlobalLeaderboard';
import { LofiPlayer }            from '../Pomodoro/LofiPlayer';
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
   Live focus minutes for a member:
   totalFocus + current session's elapsed
══════════════════════════════════════════ */
const liveMins = (member, nowMs) => {
  const base = member.totalFocus || 0;
  if (member.status === 'focusing' && member.currentSessionStart) {
    return base + Math.floor((nowMs - member.currentSessionStart) / 60_000);
  }
  return base;
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
  const [creating, setCreating] = useState(false);
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
          Join a room and focus side-by-side.<br />
          Everyone runs their own Pomodoro — the room tracks accountability.
        </p>
      </div>

      <div className="study-lobby-cards">
        <div className="study-lobby-card">
          <h3 className="study-card-title"><Zap size={14} /> Create Room</h3>
          <p className="study-card-desc">Start a room and share the code with friends.</p>
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
          <p className="study-card-desc">Enter a 6-character code to join.</p>
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

      <GlobalLeaderboard currentUid={currentUid} />
    </div>
  );
};

/* ══════════════════════════════════════════
   MEMBER STATUS PILL
══════════════════════════════════════════ */
const StatusPill = ({ status, online }) => {
  if (!online) return <span className="study-status-badge status--idle">Offline</span>;
  if (status === 'focusing') return <span className="study-status-badge status--focus">Focusing 🎯</span>;
  if (status === 'break')    return <span className="study-status-badge status--break">Break ☕</span>;
  return <span className="study-status-badge status--idle">Idle</span>;
};

/* ══════════════════════════════════════════
   ROOM
══════════════════════════════════════════ */
const Room = () => {
  const { room, members, roomCode, leaveRoom } = useStudy();
  const { user } = useAuth();

  const [lbTab,  setLbTab]  = useState('room');
  const [nowMs,  setNowMs]  = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  /* Update nowMs every 30 s for live focus minutes */
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const sortedByFocus = [...members].sort(
    (a, b) => liveMins(b, nowMs) - liveMins(a, nowMs)
  );

  const online   = members.filter(m => nowMs - (m.lastActive || 0) < 60_000);
  const focusing = members.filter(m => m.status === 'focusing');

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
            {online.length} online
          </span>
          <button className="btn-ghost study-leave-btn" onClick={leaveRoom}>
            <LogOut size={14} /> Leave
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="study-room-body">

        {/* Left column */}
        <div className="study-timer-col">

          {/* Focus summary */}
          <div className="study-focus-summary">
            <div className="study-focus-stat">
              <Target size={16} />
              <span className="study-focus-count">{focusing.length}</span>
              <span className="study-focus-label">focusing now</span>
            </div>
            <div className="study-focus-stat">
              <Users size={16} />
              <span className="study-focus-count">{online.length}</span>
              <span className="study-focus-label">online</span>
            </div>
          </div>

          {/* Tip */}
          <div className="study-tip-card">
            <p className="study-tip-title">⏱ Your own timer</p>
            <p className="study-tip-body">
              Head to <strong>Pomodoro</strong> and start your timer.
              Your focus minutes sync here automatically — no host needed.
            </p>
          </div>

          {/* Music */}
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
                  const isMe     = m.uid === user?.uid;
                  const isOnline = nowMs - (m.lastActive || 0) < 60_000;
                  const mins     = liveMins(m, nowMs);
                  return (
                    <div key={m.uid} className={`study-member ${isMe ? 'study-member--me' : ''}`}>
                      <div className="study-avatar-wrap">
                        <Avatar member={m} size={34} />
                        <span className={`study-presence-dot ${isOnline ? 'online' : ''}`} />
                      </div>
                      <div className="study-member-info">
                        <span className="study-member-name">
                          {m.displayName?.split(' ')[0]}
                          {isMe && <span className="study-you-badge">you</span>}
                        </span>
                        <StatusPill status={m.status} online={isOnline} />
                      </div>
                      <span className="study-member-mins">
                        <Clock size={11} />
                        {mins}m
                        {m.status === 'focusing' && <span className="study-live-dot" title="live" />}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Leaderboard — tabbed */}
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
                {sortedByFocus.every(m => !liveMins(m, nowMs))
                  ? <p className="study-empty">Start a Pomodoro to earn focus minutes!</p>
                  : sortedByFocus.map((m, i) => {
                    const mins = liveMins(m, nowMs);
                    return (
                      <div key={m.uid}
                        className={`study-lb-row ${i === 0 ? 'study-lb-row--first' : ''} ${m.uid === user?.uid ? 'study-lb-row--me' : ''}`}>
                        <span className="study-lb-rank">{MEDALS[i] ?? `${i + 1}.`}</span>
                        <Avatar member={m} size={26} />
                        <span className="study-lb-name">
                          {m.displayName?.split(' ')[0]}
                          {m.uid === user?.uid && <span className="study-you-badge">you</span>}
                        </span>
                        <span className="study-lb-stat">
                          <strong>{mins}</strong>m
                          {m.status === 'focusing' && <span className="study-live-dot" />}
                        </span>
                      </div>
                    );
                  })
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
