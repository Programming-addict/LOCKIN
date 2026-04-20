import { Target, Check } from 'lucide-react';
import { useDailyGoals } from '../../hooks/useDailyGoals';
import './DailyGoals.css';

const PRIORITY_COLORS = ['#6366f1', '#f59e0b', '#22c55e'];

export const DailyGoalsView = () => {
  const { goals, completed, toggleGoal, completedCount, allDone } = useDailyGoals();

  return (
    <div className="goals-page">
      <div className="page-header">
        <h1 className="page-title">Daily Goals</h1>
        <span className="badge">{completedCount}/3</span>
      </div>

      {/* Progress bar */}
      <div className="goals-progress-wrap">
        <div className="goals-progress-bar">
          <div
            className="goals-progress-fill"
            style={{ width: `${(completedCount / 3) * 100}%`, background: allDone ? '#22c55e' : 'var(--accent)' }}
          />
        </div>
        <span className="goals-progress-label">{completedCount} of 3 completed</span>
      </div>

      {/* Goals */}
      <div className="goals-list">
        {goals.map((goal, i) => (
          <div
            key={i}
            className={`goal-item ${completed[i] ? 'done' : ''}`}
            onClick={() => toggleGoal(i)}
          >
            <div
              className="goal-check"
              style={{ borderColor: PRIORITY_COLORS[i], background: completed[i] ? PRIORITY_COLORS[i] : 'transparent' }}
            >
              {completed[i] && <Check size={14} color="#fff" />}
            </div>
            <div className="goal-content">
              <span className="goal-num">Goal {i + 1}</span>
              <span className="goal-text">{goal}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Celebration */}
      {allDone && (
        <div className="goals-celebration">
          <div className="celebrate-emoji">🎉</div>
          <div className="celebrate-title">All goals complete!</div>
          <div className="celebrate-sub">Amazing work today. Your streak is growing!</div>
        </div>
      )}
    </div>
  );
};
