import { Check, Plus, X } from 'lucide-react';
import { useDailyGoals } from '../../hooks/useDailyGoals';
import { Confetti } from '../Confetti';
import './DailyGoals.css';

const PRIORITY_COLORS = ['#6366f1', '#f59e0b', '#22c55e'];

export const DailyGoalsView = () => {
  const {
    goals,
    completed,
    toggleGoal,
    addGoal,
    updateGoal,
    deleteGoal,
    completedCount,
    allDone,
    filledCount,
  } = useDailyGoals();

  return (
    <div className="goals-page">
      {/* Confetti fires the moment allDone flips true */}
      <Confetti trigger={allDone} origin={{ x: 0.5, y: 0.4 }} count={130} />

      <div className="page-header">
        <h1 className="page-title">Daily Goals</h1>
        <span className="badge">{completedCount}/{filledCount}</span>
      </div>

      {/* Progress bar */}
      <div className="goals-progress-wrap">
        <div className="goals-progress-bar">
          <div
            className="goals-progress-fill"
            style={{
              width:      filledCount > 0 ? `${(completedCount / filledCount) * 100}%` : '0%',
              background: allDone && filledCount > 0 ? '#22c55e' : 'var(--accent)',
            }}
          />
        </div>
        <span className="goals-progress-label">
          {filledCount === 0 ? 'No goals yet' : `${completedCount} of ${filledCount} completed`}
        </span>
      </div>

      {/* Goals */}
      <div className="goals-list">
        {goals.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
            No goals yet. Add one to get started!
          </div>
        ) : (
          goals.map((goal, i) => (
            <div key={i} className={`goal-item ${completed[i] ? 'done' : ''}`}>
              <button
                className="goal-check"
                onClick={() => toggleGoal(i)}
                style={{
                  borderColor: PRIORITY_COLORS[i % PRIORITY_COLORS.length],
                  background: completed[i]
                    ? PRIORITY_COLORS[i % PRIORITY_COLORS.length]
                    : 'transparent',
                }}
              >
                {completed[i] && (
                  <svg
                    className="check-draw"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2,7 5.5,11 12,3" />
                  </svg>
                )}
              </button>

              <div className="goal-content">
                <span className="goal-num">Goal {i + 1}</span>
                <input
                  type="text"
                  className="goal-input"
                  value={goal}
                  onChange={e => updateGoal(i, e.target.value)}
                  placeholder={`Add goal ${i + 1}…`}
                />
              </div>

              <button
                className="icon-btn danger goal-delete"
                onClick={() => deleteGoal(i)}
                title="Delete goal"
              >
                <X size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add goal button */}
      <button className="btn-primary add-goal-btn" onClick={addGoal}>
        <Plus size={18} />
        Add Goal
      </button>

      {/* Celebration */}
      {allDone && filledCount > 0 && (
        <div className="goals-celebration">
          <div className="celebrate-emoji">🎉</div>
          <div className="celebrate-title">All goals complete!</div>
          <div className="celebrate-sub">Amazing work today. Your streak is growing!</div>
        </div>
      )}
    </div>
  );
};
