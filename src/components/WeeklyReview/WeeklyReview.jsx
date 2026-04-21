import { ChevronLeft, ChevronRight, Clock, Zap, CheckSquare, Target, Flame, TrendingUp, Trophy, Calendar } from 'lucide-react';
import { useWeeklyStats } from '../../hooks/useWeeklyStats';
import { useStreak } from '../../hooks/useStreak';
import { useDailyGoals } from '../../hooks/useDailyGoals';
import './WeeklyReview.css';

const fmtHours = (mins) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const WeeklyReview = () => {
  const {
    dayStats, today,
    totalSessions, totalMins, totalTodos, daysWithAllGoals,
    maxSessions, isCurrentWeek, canGoNext,
    weekLabel, reflection, saveReflection,
    prevWeek, nextWeek,
  } = useWeeklyStats();

  const { completedCount, allDone } = useDailyGoals();
  const streak = useStreak(allDone);

  return (
    <div className="wr-page">

      <div className="page-header">
        <h1 className="page-title">Weekly Review</h1>
      </div>

      {/* Week nav */}
      <div className="wr-week-nav">
        <button className="icon-btn" onClick={prevWeek}><ChevronLeft size={17} /></button>
        <div className="wr-week-label">
          <span>{weekLabel}</span>
          {isCurrentWeek && <span className="wr-current-badge">This Week</span>}
        </div>
        <button className="icon-btn" onClick={nextWeek} disabled={!canGoNext} style={{ opacity: canGoNext ? 1 : 0.3 }}>
          <ChevronRight size={17} />
        </button>
      </div>

      {/* Summary stats */}
      <div className="wr-stats-grid">
        <div className="wr-stat-card accent-cyan">
          <Clock size={18} className="wr-stat-icon" />
          <div className="wr-stat-val">{fmtHours(totalMins)}</div>
          <div className="wr-stat-lbl">Focus Time</div>
        </div>
        <div className="wr-stat-card accent-purple">
          <Zap size={18} className="wr-stat-icon" />
          <div className="wr-stat-val">{totalSessions}</div>
          <div className="wr-stat-lbl">Sessions</div>
        </div>
        <div className="wr-stat-card accent-amber">
          <CheckSquare size={18} className="wr-stat-icon" />
          <div className="wr-stat-val">{totalTodos}</div>
          <div className="wr-stat-lbl">Tasks Done</div>
        </div>
        <div className="wr-stat-card accent-green">
          <Target size={18} className="wr-stat-icon" />
          <div className="wr-stat-val">{daysWithAllGoals}/7</div>
          <div className="wr-stat-lbl">Perfect Days</div>
        </div>
      </div>

      {/* Focus chart */}
      <div className="wr-section">
        <div className="wr-section-header">
          <TrendingUp size={15} />
          <span>Daily Focus Sessions</span>
        </div>
        <div className="wr-chart">
          {dayStats.map((d) => {
            const pct     = maxSessions > 0 ? (d.sessions / maxSessions) * 100 : 0;
            const isToday = d.key === today;
            return (
              <div key={d.key} className={`wr-bar-col ${isToday ? 'today' : ''}`}>
                <div className="wr-bar-count">{d.sessions > 0 ? d.sessions : ''}</div>
                <div className="wr-bar-wrap">
                  <div
                    className={`wr-bar ${d.sessions === 0 ? 'empty' : ''}`}
                    style={{ height: `${Math.max(pct, d.sessions > 0 ? 8 : 4)}%` }}
                  />
                </div>
                <div className="wr-bar-label">{d.label}</div>
                <div className="wr-bar-time">{d.mins > 0 ? fmtHours(d.mins) : '—'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goals per day */}
      <div className="wr-section">
        <div className="wr-section-header">
          <Target size={15} />
          <span>Goals Completion</span>
        </div>
        <div className="wr-goals-list">
          {dayStats.map((d) => {
            const isToday = d.key === today;
            const pct     = (d.goalsCompleted / 3) * 100;
            return (
              <div key={d.key} className={`wr-goal-row ${isToday ? 'today' : ''}`}>
                <div className="wr-goal-day">{d.label}</div>
                <div className="wr-goal-bar-wrap">
                  <div className="wr-goal-bar-track">
                    <div
                      className={`wr-goal-bar-fill ${d.allGoalsDone ? 'perfect' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className={`wr-goal-count ${d.allGoalsDone ? 'perfect' : ''}`}>
                  {d.goalsCompleted > 0 ? `${d.goalsCompleted}/3` : '—'}
                  {d.allGoalsDone && ' ✓'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Streak Section ── */}
      <div className="wr-section wr-streak-section">
        <div className="wr-section-header">
          <Flame size={15} className={streak.current > 0 ? 'flame-on' : ''} />
          <span>Streak</span>
        </div>

        <div className="wr-streak-hero">
          <Flame size={48} className={`wr-hero-flame ${streak.current > 0 ? 'active' : ''}`} />
          <div className="wr-streak-num">{streak.current}</div>
          <div className="wr-streak-unit">day streak</div>
        </div>

        <div className="wr-streak-stats">
          <div className="wr-streak-stat">
            <Trophy size={16} className="ss-gold" />
            <div className="wr-ss-val">{streak.best}</div>
            <div className="wr-ss-lbl">Best Ever</div>
          </div>
          <div className="wr-streak-stat">
            <Target size={16} className="ss-cyan" />
            <div className="wr-ss-val">{completedCount}/3</div>
            <div className="wr-ss-lbl">Today's Goals</div>
          </div>
          <div className="wr-streak-stat">
            <Calendar size={16} className="ss-blue" />
            <div className="wr-ss-val">
              {streak.lastDate
                ? new Date(streak.lastDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '—'}
            </div>
            <div className="wr-ss-lbl">Last Done</div>
          </div>
        </div>

        <div className={`wr-today-status ${allDone ? 'done' : 'pending'}`}>
          {allDone
            ? "✅ Today's goals complete — streak maintained!"
            : '⏳ Complete all 3 daily goals today to keep your streak'}
        </div>

        {streak.current > 0 && (
          <div className="wr-milestones">
            {[3, 7, 14, 30, 60, 100].map(m => (
              <div key={m} className={`wr-milestone ${streak.current >= m ? 'reached' : ''}`}>
                <span className="wr-ms-num">{m}</span>
                <span className="wr-ms-lbl">days</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reflection */}
      <div className="wr-section">
        <div className="wr-section-header" style={{ marginBottom: 10 }}>
          <span>✍️</span>
          <span>Weekly Reflection</span>
        </div>
        <textarea
          className="wr-reflection"
          placeholder="How was your week? What went well? What would you do differently?&#10;&#10;Write anything — this is just for you."
          value={reflection}
          onChange={e => saveReflection(e.target.value)}
          rows={6}
        />
        <div className="wr-reflection-hint">Auto-saved · Stored locally</div>
      </div>

    </div>
  );
};
