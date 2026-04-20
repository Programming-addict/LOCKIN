import { Flame, Trophy, Calendar, Target } from 'lucide-react';
import { useStreak } from '../../hooks/useStreak';
import { useDailyGoals } from '../../hooks/useDailyGoals';
import './Streak.css';

export const StreakView = () => {
  const { completedCount, allDone } = useDailyGoals();
  const streak = useStreak(allDone);

  return (
    <div className="streak-page">
      <div className="page-header">
        <h1 className="page-title">Streak Tracker</h1>
      </div>

      {/* Main streak display */}
      <div className="streak-hero">
        <div className="streak-flame-wrap">
          <Flame size={56} className={`hero-flame ${streak.current > 0 ? 'active' : ''}`} />
        </div>
        <div className="streak-num">{streak.current}</div>
        <div className="streak-label">day streak</div>
        {streak.current === 0 && (
          <div className="streak-hint">Complete all 3 daily goals to start your streak!</div>
        )}
      </div>

      {/* Stats row */}
      <div className="streak-stats">
        <div className="streak-stat-card">
          <Trophy size={20} className="stat-icon gold" />
          <div className="streak-stat-val">{streak.best}</div>
          <div className="streak-stat-lbl">Best Streak</div>
        </div>

        <div className="streak-stat-card">
          <Target size={20} className="stat-icon purple" />
          <div className="streak-stat-val">{completedCount}/3</div>
          <div className="streak-stat-lbl">Today's Goals</div>
        </div>

        <div className="streak-stat-card">
          <Calendar size={20} className="stat-icon blue" />
          <div className="streak-stat-val">
            {streak.lastDate
              ? new Date(streak.lastDate + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' })
              : '—'}
          </div>
          <div className="streak-stat-lbl">Last Completed</div>
        </div>
      </div>

      {/* Today's status */}
      <div className={`today-status ${allDone ? 'done' : 'pending'}`}>
        {allDone ? (
          <>✅ Today's goals are complete — streak maintained!</>
        ) : (
          <>⏳ Complete all 3 daily goals today to keep your streak</>
        )}
      </div>

      {/* Milestone hints */}
      {streak.current > 0 && (
        <div className="milestones">
          {[3, 7, 14, 30, 60, 100].map(m => (
            <div key={m} className={`milestone ${streak.current >= m ? 'reached' : ''}`}>
              <span className="ms-num">{m}</span>
              <span className="ms-lbl">days</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
