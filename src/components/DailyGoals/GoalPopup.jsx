import { useState } from 'react';
import { Target } from 'lucide-react';
import './DailyGoals.css';

export const GoalPopup = ({ onSave }) => {
  const [goals, setGoals] = useState(['', '', '']);

  const update = (i, val) => {
    const next = [...goals];
    next[i] = val;
    setGoals(next);
  };

  const filledGoals = goals.filter(g => g.trim().length > 0);
  const hasAtLeastOne = filledGoals.length > 0;

  const submit = (e) => {
    e.preventDefault();
    if (!hasAtLeastOne) return;
    onSave(goals.map(g => g.trim()));
  };

  return (
    <div className="popup-overlay">
      <div className="popup-modal">
        <div className="popup-icon"><Target size={28} /></div>
        <h2 className="popup-title">Set Today's Goals</h2>
        <p className="popup-sub">What are the most important things you'll accomplish today? (at least 1 required)</p>

        <form onSubmit={submit} className="popup-form">
          {goals.map((g, i) => (
            <div key={i} className="popup-field">
              <span className="popup-num">{i + 1}</span>
              <input
                className="field-input"
                placeholder={`Goal ${i + 1}…`}
                value={g}
                onChange={e => update(i, e.target.value)}
                autoFocus={i === 0}
              />
            </div>
          ))}

          <button
            className={`btn-primary popup-submit ${!hasAtLeastOne ? 'disabled' : ''}`}
            type="submit"
            disabled={!hasAtLeastOne}
          >
            Start My Day →
          </button>

          {!hasAtLeastOne && (
            <p className="popup-hint">At least 1 goal is required to continue</p>
          )}
        </form>
      </div>
    </div>
  );
};
