import { useState } from 'react';
import { Trophy, Clock, Zap, Calendar } from 'lucide-react';
import { useGlobalLeaderboard } from '../../hooks/useGlobalLeaderboard';
import { useLeaderboard }       from '../../hooks/useLeaderboard';
import { useAuth }              from '../../context/AuthContext';
import './Leaderboard.css';

/* ── helpers ── */
const fmtMins = (m) => {
  if (!m) return '0m';
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
};

const daysUntilMonday = () => {
  const day = new Date().getDay(); // 0=Sun … 6=Sat
  const daysLeft = day === 0 ? 1 : 8 - day;
  return daysLeft;
};

const Avatar = ({ src, name, size = 40, rank }) => {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const medalClass = rank === 1 ? 'medal-gold' : rank === 2 ? 'medal-silver' : rank === 3 ? 'medal-bronze' : '';
  return (
    <div className={`lb-avatar ${medalClass}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {src
        ? <img src={src} alt={name} referrerPolicy="no-referrer" />
        : <span>{initials}</span>}
    </div>
  );
};

/* ── Skeleton ── */
const SkeletonRow = () => (
  <div className="lb-skeleton-row">
    <div className="lb-skel lb-skel-rank" />
    <div className="lb-skel lb-skel-avatar" />
    <div className="lb-skel lb-skel-name" />
    <div className="lb-skel lb-skel-stat" />
  </div>
);

/* ── Podium ── */
const Podium = ({ entries, statKey, statLabel }) => {
  const first  = entries[0];
  const second = entries[1];
  const third  = entries[2];

  const PodiumBlock = ({ entry, rank, height }) => {
    if (!entry) return <div className="podium-slot podium-empty" style={{ height }} />;
    return (
      <div className={`podium-slot podium-rank-${rank}`}>
        <Avatar src={entry.photoURL} name={entry.displayName} size={rank === 1 ? 60 : 48} rank={rank} />
        <div className="podium-name">{entry.displayName || 'Anonymous'}</div>
        <div className="podium-stat">{statKey === 'focusMins' ? fmtMins(entry.focusMins) : fmtMins(entry.totalMins)}</div>
        <div className={`podium-block pb-${rank}`} style={{ height }}>
          <span className="podium-rank-num">#{rank}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="podium-row">
      <PodiumBlock entry={second} rank={2} height={70} />
      <PodiumBlock entry={first}  rank={1} height={100} />
      <PodiumBlock entry={third}  rank={3} height={50} />
    </div>
  );
};

/* ── Weekly tab content ── */
const WeeklyTab = ({ entries, loading, user }) => {
  const userRank = user ? entries.findIndex(e => e.uid === user.uid) + 1 : 0;

  if (loading) {
    return (
      <div className="lb-list">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="lb-empty">
        <Trophy size={40} />
        <p>No entries yet this week.<br />Complete a focus session to appear!</p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <>
      <Podium entries={top3} statKey="focusMins" />
      {rest.length > 0 && (
        <div className="lb-list">
          {rest.map((entry, i) => {
            const rank = i + 4;
            const isYou = user && entry.uid === user.uid;
            return (
              <div key={entry.uid} className={`lb-row ${isYou ? 'lb-row-you' : ''}`}>
                <span className="lb-rank">#{rank}</span>
                <Avatar src={entry.photoURL} name={entry.displayName} size={34} />
                <div className="lb-info">
                  <span className="lb-name">{entry.displayName || 'Anonymous'}</span>
                  {isYou && <span className="you-badge">you</span>}
                </div>
                <div className="lb-stats">
                  <span className="lb-stat-primary">{fmtMins(entry.focusMins)}</span>
                  <span className="lb-stat-secondary">{entry.sessions ?? 0} sessions</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

/* ── All-time tab content ── */
const AllTimeTab = ({ entries, loading, user }) => {
  if (loading) {
    return (
      <div className="lb-list">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="lb-empty">
        <Trophy size={40} />
        <p>No all-time data yet.</p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <>
      <Podium entries={top3} statKey="totalMins" />
      {rest.length > 0 && (
        <div className="lb-list">
          {rest.map((entry, i) => {
            const rank = i + 4;
            const isYou = user && entry.uid === user.uid;
            return (
              <div key={entry.uid || entry.id} className={`lb-row ${isYou ? 'lb-row-you' : ''}`}>
                <span className="lb-rank">#{rank}</span>
                <Avatar src={entry.photoURL} name={entry.displayName} size={34} />
                <div className="lb-info">
                  <span className="lb-name">{entry.displayName || 'Anonymous'}</span>
                  {isYou && <span className="you-badge">you</span>}
                </div>
                <div className="lb-stats">
                  <span className="lb-stat-primary">{fmtMins(entry.totalMins)}</span>
                  <span className="lb-stat-secondary">{entry.totalPomos ?? 0} sessions</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

/* ── Main component ── */
export const LeaderboardView = () => {
  const [tab, setTab] = useState('week');
  const { user } = useAuth();

  const { entries: weekEntries, loading: weekLoading, weekLabel } = useGlobalLeaderboard(50);
  const { entries: allEntries, loading: allLoading } = useLeaderboard();

  const userWeekRank    = user ? weekEntries.findIndex(e => e.uid === user.uid) + 1 : 0;
  const userWeekEntry   = user ? weekEntries.find(e => e.uid === user.uid) : null;
  const daysLeft        = daysUntilMonday();

  return (
    <div className="lb-page">
      {/* Header */}
      <div className="page-header">
        <Trophy size={22} className="lb-header-icon" />
        <h1 className="page-title">Leaderboard</h1>
      </div>

      <div className="lb-meta-row">
        {weekLabel && (
          <span className="lb-week-label">
            <Calendar size={13} /> {weekLabel}
          </span>
        )}
        <span className="lb-reset-chip">
          Resets in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Your stats card */}
      {user && userWeekEntry && (
        <div className="lb-your-stats">
          <div className="your-stats-rank">
            <Trophy size={14} />
            <span>#{userWeekRank || '—'}</span>
          </div>
          <div className="your-stats-divider" />
          <div className="your-stats-item">
            <Clock size={13} />
            <span>{fmtMins(userWeekEntry.focusMins ?? 0)} focus</span>
          </div>
          <div className="your-stats-divider" />
          <div className="your-stats-item">
            <Zap size={13} />
            <span>{userWeekEntry.sessions ?? 0} sessions</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="lb-tabs">
        <button
          className={`lb-tab ${tab === 'week' ? 'active' : ''}`}
          onClick={() => setTab('week')}
        >
          This Week
        </button>
        <button
          className={`lb-tab ${tab === 'alltime' ? 'active' : ''}`}
          onClick={() => setTab('alltime')}
        >
          All Time
        </button>
      </div>

      {/* Content */}
      <div className="lb-content">
        {tab === 'week'
          ? <WeeklyTab entries={weekEntries} loading={weekLoading} user={user} />
          : <AllTimeTab entries={allEntries} loading={allLoading} user={user} />
        }
      </div>
    </div>
  );
};
