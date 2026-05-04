import { useState } from 'react';
import {
  Users, Plus, LogIn, Copy, Check, X, Crown,
  Trophy, LogOut, Flame, Clock,
} from 'lucide-react';
import { useParty } from '../../context/PartyContext';
import { useAuth }  from '../../context/AuthContext';
import './PartyPanel.css';

/* ── Avatar ── */
const Avatar = ({ member, size = 36 }) => {
  const initial = (member.displayName || '?').charAt(0).toUpperCase();
  return (
    <div className="party-avatar" style={{ '--av-size': `${size}px`, '--av-fs': `${size * 0.38}px` }}>
      {member.photoURL
        ? <img src={member.photoURL} alt={member.displayName} referrerPolicy="no-referrer" />
        : <span>{initial}</span>}
      {member.isOnline && <span className="avatar-online" />}
    </div>
  );
};

/* ── Helpers ── */
const fmt = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const MEDAL = ['🥇', '🥈', '🥉'];

/* ── Member row ── */
const MemberRow = ({ member, isHost, isMe }) => {
  const isWork    = member.timerMode === 'work';
  const modeColor = isWork ? 'var(--blue)' : 'var(--green)';
  const modeLabel = isWork ? 'FOCUS' : 'BREAK';

  return (
    <div className={`party-member-row ${isMe ? 'is-me' : ''}`}>
      <Avatar member={member} size={38} />
      <div className="pmr-info">
        <div className="pmr-name">
          {member.displayName}
          {isHost && <Crown size={11} className="host-crown" />}
          {isMe   && <span className="me-badge">you</span>}
        </div>
        <div className="pmr-status" style={{ color: member.timerRunning ? modeColor : 'var(--text-muted)' }}>
          {member.timerRunning
            ? <><Clock size={10} /> {modeLabel} &middot; {fmt(member.timerSeconds)}</>
            : member.isOnline ? 'Online · idle' : 'Away'}
        </div>
      </div>
      <div className="pmr-sessions">
        <span className="pmr-sessions-val">{member.todaySessions}</span>
        <span className="pmr-sessions-lbl">today</span>
      </div>
    </div>
  );
};

/* ── Leaderboard row ── */
const LbRow = ({ member, rank, isMe }) => (
  <div className={`lb-row ${isMe ? 'is-me' : ''} ${rank <= 3 ? `top-${rank}` : ''}`}>
    <div className="lb-rank">{MEDAL[rank - 1] ?? rank}</div>
    <Avatar member={member} size={30} />
    <div className="lb-name">
      {member.displayName}
      {isMe && <span className="me-badge">you</span>}
    </div>
    <div className="lb-right">
      <div className="lb-stat">
        <span className="lb-val">{member.todaySessions}</span>
        <span className="lb-lbl">sessions</span>
      </div>
      <div className="lb-stat">
        <Flame size={10} style={{ color: 'var(--amber)' }} />
        <span className="lb-val">{member.streak}</span>
        <span className="lb-lbl">streak</span>
      </div>
    </div>
  </div>
);

/* ── Main component ── */
export const PartyPanel = ({ onClose }) => {
  const { user }    = useAuth();
  const {
    party, isInParty, loading, error, setError,
    createParty, joinParty, leaveParty,
  } = useParty();

  const [tab,       setTab]       = useState('members'); // 'members' | 'leaderboard'
  const [view,      setView]      = useState('join');    // 'join' | 'create'
  const [partyName, setPartyName] = useState('');
  const [joinCode,  setJoinCode]  = useState('');
  const [copied,    setCopied]    = useState(false);

  const copyCode = async () => {
    if (!party?.code) return;
    await navigator.clipboard.writeText(party.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await createParty(partyName);
    setPartyName('');
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    await joinParty(joinCode);
    setJoinCode('');
  };

  const handleTabSwitch = (v) => { setView(v); setError(null); };

  const members        = party ? Object.values(party.members || {}) : [];
  const bySession      = [...members].sort((a, b) => b.todaySessions - a.todaySessions);
  const studyingCount  = members.filter(m => m.timerRunning).length;

  return (
    <div className="party-panel" role="dialog" aria-label="Study with Friends">
      {/* Header */}
      <div className="party-panel-hd">
        <div className="party-panel-title">
          <Users size={17} />
          <span>{isInParty ? party.name : 'Study with Friends'}</span>
          {isInParty && studyingCount > 0 && (
            <span className="studying-badge">{studyingCount} studying</span>
          )}
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      {!isInParty ? (
        /* ─── Create / Join ─── */
        <div className="party-lobby">
          <div className="party-toggle-tabs">
            <button
              className={`ptab ${view === 'join' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('join')}
            >
              <LogIn size={13} /> Join
            </button>
            <button
              className={`ptab ${view === 'create' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('create')}
            >
              <Plus size={13} /> Create
            </button>
          </div>

          {error && <div className="party-error">{error}</div>}

          {view === 'join' ? (
            <form className="party-form" onSubmit={handleJoin}>
              <label className="field-label">Party Code</label>
              <input
                className="field-input party-code-input"
                placeholder="XXXXXX"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                spellCheck={false}
                autoFocus
              />
              <button
                className="btn-primary party-submit-btn"
                type="submit"
                disabled={loading || joinCode.length < 6}
              >
                {loading ? 'Joining…' : 'Join Party'}
              </button>
            </form>
          ) : (
            <form className="party-form" onSubmit={handleCreate}>
              <label className="field-label">Party Name (optional)</label>
              <input
                className="field-input"
                placeholder="e.g. Finals Study Group"
                value={partyName}
                onChange={e => setPartyName(e.target.value)}
                maxLength={32}
                autoFocus
              />
              <button
                className="btn-primary party-submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating…' : 'Create Party'}
              </button>
            </form>
          )}

          <p className="party-hint">
            See each other's timers live and compete on the leaderboard.
          </p>
        </div>
      ) : (
        /* ─── In-party view ─── */
        <>
          {/* Code bar */}
          <div className="party-code-bar">
            <span className="pcb-label">Invite code</span>
            <span className="pcb-code">{party.code}</span>
            <button className="icon-btn copy-btn" onClick={copyCode} title="Copy code">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>

          {/* Tabs */}
          <div className="party-tabs">
            <button
              className={`party-tab ${tab === 'members' ? 'active' : ''}`}
              onClick={() => setTab('members')}
            >
              <Users size={13} /> Members
              <span className="tab-count">{members.length}</span>
            </button>
            <button
              className={`party-tab ${tab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setTab('leaderboard')}
            >
              <Trophy size={13} /> Leaderboard
            </button>
          </div>

          {/* Content */}
          <div className="party-content">
            {tab === 'members' && (
              <div className="party-members-list">
                {members.length === 0 ? (
                  <p className="party-empty">No members yet.</p>
                ) : (
                  members.map(m => (
                    <MemberRow
                      key={m.uid}
                      member={m}
                      isHost={m.uid === party.hostUid}
                      isMe={m.uid === user?.uid}
                    />
                  ))
                )}
              </div>
            )}

            {tab === 'leaderboard' && (
              <div className="party-leaderboard">
                <div className="lb-subtitle">Today's Sessions</div>
                {bySession.length === 0 ? (
                  <p className="party-empty">No data yet. Start a session!</p>
                ) : (
                  bySession.map((m, i) => (
                    <LbRow
                      key={m.uid}
                      member={m}
                      rank={i + 1}
                      isMe={m.uid === user?.uid}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Leave */}
          <button className="party-leave-btn" onClick={leaveParty}>
            <LogOut size={13} />
            Leave Party
          </button>
        </>
      )}
    </div>
  );
};
